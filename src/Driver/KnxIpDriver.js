var util     = require('util'),
    events   = require('events'),
    dgram    = require('dgram'),
    _        = require('underscore'),
    KnxIp    = require('./KnxIp'),
    Message  = require('../Message'),
    Log      = require('../Log'),
    async    = require('async'),
    ConnectionRequest = KnxIp.ConnectionRequest;

var STATUS_CLOSED     = 'closed',
    STATUS_CONNECTING = 'connecting',
    STATUS_OPEN_IDLE  = 'open_idle';

/**
 * Driver to connect an knx ip interface.
 *
 * @class Driver.KnxIpDriver
 * @extends events.EventEmitter
 *
 * @constructor
 * @param {Object} options Config options
 */
function KnxIpDriver(options) {

    events.EventEmitter.apply(this, arguments);

    /**
     * Driver options
     *
     * @property {Object} _options
     * @private
     */
    this._options = _.defaults(options || {}, {
        remotePort: 3671,
        maxRepeats: 6,
        logger: undefined,
        localAddress: null
    });

    if (!this._options.remoteAddress) {
        throw Error('Missing option "remoteAddress" to create KnxIpDriver');
    }

    /**
     * The current driver status.
     * @type {"closed"|"connecting"|"open_idle"} _status
     * @private
     */
    this._status = STATUS_CLOSED;

    /**
     * Current Channel ID
     * @type {Number}
     * @private
     */
    this._channelId = undefined;

    /**
     * Last sequence number
     * @type {Number}
     * @private
     */
    this._sequence = 0;

    /**
     * Logger instance
     * @type {Log.LoggerInterface}
     * @private
     */
    this._logger = this._options.logger || new Log.NullLogger();

    this.on('packet', this._onPacket.bind(this));
}
util.inherits(KnxIpDriver, events.EventEmitter);

/**
 * Fires a message event if a request from the bus was received
 *
 * @event message
 * @param {Message} message Message object
 */

/**
 * Fired if the driver has connected to the remote interface
 *
 * @event connected
 */

/**
 * Fires a packet event for each received knxip packet
 *
 * @event packet
 * @private
 * @param {Driver.KnxIp.Packet} packet Packet object
 */

/**
 * @inheritDoc Driver.DriverInterface
 */
KnxIpDriver.prototype.connect = function(callback) {
    var self = this,
        options = self._options;

    if (this._status === STATUS_OPEN_IDLE) {
        throw new Error('Driver is already connected');
    }

    if (callback) {
        this.once('connected', callback.bind(this));
    }

    if(this._status !== STATUS_CLOSED) {
        return;
    }

    this._status = STATUS_CONNECTING;

    async.parallel([
        self._createAndBindSocket.bind(self),
        self._createAndBindSocket.bind(self)
    ], function(err, sockets) {

        var connectionRequest;

        self._connectionSocket = sockets[0];
        self._dataSocket = sockets[1];

        connectionRequest = self._createConnectionRequest();

        self._sendAndExpect(connectionRequest, 'connection.response', function(response) {

            var endpoint = response.getEndpoint(),
                logMsg = 'Connected to Knx/IP Interface';

            if (endpoint) {
                logMsg += " on " + endpoint.getAddress() + ":" + endpoint.getPort();
            }

            self._channelId = response.getChannelId();
            self._sequence = 0;
            self._status = STATUS_OPEN_IDLE;
            self.emit('connected', response);
            self._startHeartbeat();

            self._logger.info(logMsg);
        });
    });
};

/**
 * @inheritDoc Driver.DriverInterface
 */
KnxIpDriver.prototype.disconnect = function() {
    var self = this,
        address = this._connectionSocket.address(),
        endpoint = new KnxIp.Hpai(address.address, address.port),
        request = new KnxIp.DisconnectRequest(endpoint, this._channelId);

    this._sendAndExpect(request,  'disconnect.response', function() {
        self._status = STATUS_CLOSED;
    });
};

/**
 * @inheritDoc Driver.DriverInterface
 */
KnxIpDriver.prototype.isConnected = function() {
    return this._status === STATUS_OPEN_IDLE;
};

/**
 * @inheritDoc Driver.DriverInterface
 */
KnxIpDriver.prototype.send = function(message, callback) {
    var self = this;

    if (this._status !== STATUS_OPEN_IDLE) {
        throw new Error('Can not send messages while driver is not connected');
    }

    var cemi = new KnxIp.Cemi('L_Data.req', message),
        request = new KnxIp.TunnelingRequest(this._channelId, this._sequence++, cemi);

    this._sendAndExpect(request, 'tunneling.ack', function() {
        this._logger.verbose("Send Message to " + message.getDestination() + ": " + message.getData());
        if (callback) {
            callback.call(self);
        }
    });
};

/**
 * Returns object with current driver options
 *
 * @returns {Object}
 */
KnxIpDriver.prototype.getOptions = function() {
    return this._options;
};

/**
 * Creates an new udp4 socket and bind it to all devices on an empty port
 *
 * @private
 * @return {dgram.Socket}
 */
KnxIpDriver.prototype._createAndBindSocket = function(callback) {
    var socket = dgram.createSocket('udp4'),
        localAddress = this._options.localAddress || this._determineLocalAddress();

    socket.on('message', this._onSocketMessage.bind(this));

    socket.bind(null, localAddress, function() {
        callback(null, socket);
    });

    return socket;
};

/**
 * Checks local devices to match the set up remote address. The
 * first matching ip address will be returned. This method uses the
 * `os` module to access the network interfaces. Subnet masks are
 * supported since `node v0.11.2`, for older node versions always
 * class c mask `255.255.255.0` is used.
 *
 * @returns {String} ip address
 * @private
 */
KnxIpDriver.prototype._determineLocalAddress = function() {
    var interfaces = require('os').networkInterfaces(),
        addresses = _.flatten(_.values(interfaces)),
        remote = this._options.remoteAddress.split("."),
        match;

    match = _.find(addresses, function(address) {
        var mask = (address.mask || "255.255.255.0").split("."),
            addr = address.address.split(".");

        if (address.family !== 'IPv4' || address.internal) {
            return false;
        }

        return _.every(addr, function(element, index, list) {
            return (addr[index] & mask[index]) === (remote[index] & mask[index]);
        });
    });

    if(!match || !match.address) {
        throw new Error('Can not determine local address');
    }

    return match.address;
};

/**
 * Triggered if data or control socket receives data. The received data is passed to
 * this callback and will be parsed into a knx/ip packet. After this, the #packet event
 * is triggered and the parsed packet is passed to bound callbacks.
 *
 * @param {buffer.Buffer} buffer
 * @private
 */
KnxIpDriver.prototype._onSocketMessage = function(buffer) {
    var packet;

    try {
        packet = KnxIp.Packet.factory(buffer);
    } catch (e) {}

    if (packet) {
        this._logger.debug('recv: ', packet);
        this.emit('packet', packet);
    }
};

/**
 * Triggered when socket messages were parsed to packets. The packet is passed to the
 * event callbacks.
 *
 * @param {Driver.KnxIp.Packet} packet
 * @private
 */
KnxIpDriver.prototype._onPacket = function(packet) {

    var self = this,
        cemi;

    if (packet instanceof KnxIp.TunnelingRequest) {

        cemi = packet.getCemi();

        this._socketSend(new KnxIp.TunnelingAck(
            packet.getChannelId(),
            packet.getSequence()
        ));

        if(cemi && cemi.getMessageCode() !== "L_Data.con") {
            this._confirmMessage(cemi, packet.getSequence(), function() {
                var message = cemi.getMessage();
                self._sequence = packet.getSequence() + 1;
                self.emit('message', message);
                self._logger.verbose("Received Message from " + message.getOrigin() + " to " + message.getDestination() + ": " + message.getData());
            });
        }
    } else if (packet instanceof KnxIp.DisconnectRequest) {

        this._socketSend(new KnxIp.DisconnectResponse(
            packet.getChannelId(),
            0
        ));

        this._status = STATUS_CLOSED;
        this.emit('disconnect', packet);
    }
};

/**
 * Sends a repeated message back to the remote to confirm the retrieval.
 *
 * @param {Driver.KnxIp.Cemi} original
 * @param {Function} callback
 * @private
 */
KnxIpDriver.prototype._confirmMessage = function(original, sequence, callback) {
    var clone = KnxIp.Cemi.parse(original.toArray()),
        request = new KnxIp.TunnelingRequest(this._channelId, sequence, clone);

    clone.setMessageCode("L_Data.con");

    this._sendAndExpect(request, 'tunneling.ack', callback);
};

/**
 * Returns a new connection request based on driver options
 *
 * @returns {Driver.KnxIp.ConnectionRequest}
 * @private
 */
KnxIpDriver.prototype._createConnectionRequest = function() {
    var connectionAddress = this._connectionSocket.address(),
        dataAddress = this._dataSocket.address();

    return new KnxIp.ConnectionRequest(
        new KnxIp.Hpai(connectionAddress.address, connectionAddress.port),
        new KnxIp.Hpai(dataAddress.address, dataAddress.port)
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
        options = this._options,
        repeatsLeft = options.maxRepeats,
        timeout;

    function checkMaxAttempsAndResend () {
        self._socketSend(packet);
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
};

/**
 * Starts the heartbeat to keep connection alive
 *
 * @private
 */
KnxIpDriver.prototype._startHeartbeat = function() {

    var self = this,
        connectionAddress = this._connectionSocket.address(),
        stateRequest = new KnxIp.ConnectionStateRequest(
            this._channelId,
            new KnxIp.Hpai(connectionAddress.address, connectionAddress.port)
        );

    clearTimeout(this._heartbeatTimeout);

    this._sendAndExpect(stateRequest, 'connectionstate.response', function(){
        self._heartbeatTimeout = setTimeout(function() {
            self._startHeartbeat();
        }, 60000);
    });
};

/**
 * Send the given packet to the remote host
 *
 * @param {Driver.KnxIp.Packet} packet Packet to send
 * @private
 */
KnxIpDriver.prototype._socketSend = function(packet) {
    var socket,
        options = this._options,
        buffer = packet.toBuffer();

    if (packet instanceof KnxIp.TunnelingRequest ||
            packet instanceof KnxIp.TunnelingAck) {
        socket = this._dataSocket;
    } else {
        socket = this._connectionSocket;
    }

    this._logger.debug('send: ', packet);

    socket.send(buffer, 0, buffer.length, options.remotePort, options.remoteAddress);
};

module.exports = KnxIpDriver;