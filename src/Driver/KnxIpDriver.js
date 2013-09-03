var util     = require('util'),
    events   = require('events'),
    dgram    = require('dgram'),
    defaults = require('underscore').defaults,
    KnxIp    = require('./KnxIp'),
    Log      = require('../Log'),
    ConnectionRequest = KnxIp.ConnectionRequest;

// Driver statuses
var STATUS_CLOSED     = 'closed',
    STATUS_CONNECTING = 'connecting',
    STATUS_OPEN_IDLE  = 'open_idle';

// Switched light on: 06 10 04 20 00 15 04 01 00 00 29 00 bc d0 11 04 0a 07 01 00 81
// Server disconnects: 06 10 02 09 00 10 01 00 08 01 c0 a8 38 65 0e 57


/**
 * Driver to connect an knx ip interface.
 *
 * @class Driver.KnxIpDriver
 * @extends event.EventEmitter
 *
 * @constructor
 * @param {Object} options Config options
 */
function KnxIpDriver(options) {

    events.EventEmitter.apply(this, arguments);

    this.options = defaults(options || {}, {
        /**
         * IP-Address for the local endpoint. Leave empty to listen on all devices.
         * @cfg {String}
         */
        localAddress: null,

        /**
         * Port number for the local endpoint
         * @cfg {String}
         */
        localPort: 3672,

        /**
         * IP-Address for the remote endpoint
         * @cfg {String}
         */
        remoteAddress: undefined,

        /**
         * Port number for the remote endpoint
         * @cfg {String}
         */
        remotePort: 3671,

        /**
         * Logger instance for log messages
         * @cfg {log.LoggerInterface}
         */
        logger: new Log.NullLogger(),

        /**
         * Number of max repeats if the expected answer is not returned
         * @cfg {Number}
         */
        maxRepeats: 6
    });

    if(!this.options.remoteAddress) {
        throw new Error('KnxIpDriver needs a remote address');
    }

    this._log = this.options.logger;

    this._status = KnxIpDriver.STATUS_CLOSED;

    this.on('packet', this._onPacket.bind(this));
}
util.inherits(KnxIpDriver, events.EventEmitter);

/**
 * Current driver status
 *
 * @property {String} _status
 * @private
 */

/**
 * UDP/Datagram socket instance.
 *
 * See [nodejs docs][1]
 * for further informations.
 *
 * [1]: http://nodejs.org/api/dgram.html#dgram_class_dgram_socket
 *
 * @property {dgram.Socket} _socket
 * @private
 */

/**
 * ID of the connection channel
 *
 * This ID will be assigned by the remote host with the connection response.
 *
 * @property {Number} _channelId
 * @private
 */

/**
 * Next sequence number
 *
 * This is needed for each sent packet. It will be used to validate the packet
 * sequence. Its an number between 0 and 255 and will be raised for each packet.
 * If 255 is reached, it will be resetted to 0.
 *
 * @property {Number} _sequenceNumber
 * @private
 */

/**
 * Fired when the connection was established
 *
 * @event connected
 */

/**
 * Fired when a packet was received
 *
 * @event packet
 * @param {Driver.KnxIp.Packet} packet The received packet
 */

/**
 * Fired when a packet with a bus message was received
 *
 * @event message
 * @param {Message} message The received message
 */

/**
 * Opens the connection to the remote host
 */
KnxIpDriver.prototype.connect = function() {

    var socket,
        self    = this,
        options = this.options,
        request = this._createConnectionRequest();

    this._status = STATUS_CONNECTING;

    this._socket = socket = dgram.createSocket('udp4');
    socket.bind(options.localPort, options.localAddress);
    socket.on('message', this._onSocketMessage.bind(this));

    this._log.info('Connecting to ' + options.remoteAddress + ':' + options.remotePort);

    this._sendAndExpect(request, 'connection.response', function(packet) {
        var data = packet.getData();
        self._channelId = data[0];
        self._status = STATUS_OPEN_IDLE;
        self.emit('connected');
        this._log.info('Response received from ' + data[4] + "." + data[5] + "." + data[6] + "." + data[7] + ":" + ((data[8] << 8) + data[9]));
    });
};

/**
 * Returns a new connection request based on driver options
 *
 * @returns {KnxIp.ConnectionRequest}
 * @private
 */
KnxIpDriver.prototype._createConnectionRequest = function() {
    var options = this.options;
    return new ConnectionRequest(
        new KnxIp.Hpai(options.localAddress, options.localPort),
        new KnxIp.Hpai(options.localAddress, options.localPort)
    );
};

/**
 * Sends a packet to the remote host and waits until a packet with the expected
 * service is returned.
 *
 * @param {Driver.KnxIp.Packet} packet Packet to send
 * @param {String} exxpectedService Expected service name
 * @param {Function} callback Callback to be executed after the expected message was received
 * @private
 */
KnxIpDriver.prototype._sendAndExpect = function(packet, expectedService, callback) {
    var self = this,
        options = this.options,
        buffer = packet.toBuffer(),
        repeatsLeft = options.maxRepeats,
        timeout;

    function checkMaxAttempsAndResend () {
        self._socketSend(buffer);
        --repeatsLeft;
        if (repeatsLeft > 0) {
            timeout = setTimeout(checkMaxAttempsAndResend, 1000);
        }
    }

    function checkResponseAndKillTimeout (packet) {
        if (packet.getServiceName() === expectedService) {
            self.removeListener('packet', checkResponseAndKillTimeout);
            clearTimeout(timeout);
            if (callback) {
                callback.call(self, packet);
            }
        }
    }

    this.on('packet', checkResponseAndKillTimeout);
    checkMaxAttempsAndResend();
}

/**
 * Send the given buffer to the remote host
 *
 * @param {buffer.Buffer} buffer Data to send
 * @private
 */
KnxIpDriver.prototype._socketSend = function(buffer) {
    var socket = this._socket,
        options = this.options;

    socket.send(buffer, 0, buffer.length, options.remotePort, options.remoteAddress);
}

/**
 * Executed if socket receives a message. This method will try to translate the message
 * into a packet. If this succeed, a #packet event will be emitted.
 *
 * @param {buffer.Buffer} data
 * @triggers packet
 * @private
 */
KnxIpDriver.prototype._onSocketMessage = function(data) {
    var packet;

    try {
        packet = KnxIp.Packet.factory(data);
    } catch (e) {
        this._log.warning("Received buffer can't be converted to packet", data);
        return;
    }

    this.emit('packet', packet);
};

/**
 *
 * @param {Driver.KnxIp.Packet} packet
 * @triggers message
 * @private
 */
KnxIpDriver.prototype._onPacket = function(packet) {
    var response;

    if (this.isConnected()) {
        if (packet instanceof KnxIp.TunnelingRequest) {
            response = new KnxIp.TunnelingAck(this._channelId, packet.getSequence());
            this._socketSend(response.toBuffer());
            this.emit('message', packet.getMessage());
        }
    }
}

/**
 * Returns if the driver is connected to an ip interface or not.
 *
 * @returns {Boolean}
 */
KnxIpDriver.prototype.isConnected = function() {
    return this._status === STATUS_OPEN_IDLE;
};

/**
 * Send a message to the connected ip interface
 *
 * @param {Message} msg
 */
KnxIpDriver.prototype.send = function(msg) {

}

module.exports = KnxIpDriver;