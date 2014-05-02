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
     * Hash of sequence numbers and their tunneling requests
     *
     * @type {Object}
     * @private
     */
    this._requests = {};

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

        self._connectionSocket = sockets[0];
        self._dataSocket = sockets[1];

        self._sendUntil(self._createConnectionRequest(), function() {
            return self._status !== STATUS_CONNECTING;
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

    this._sendUntil(request, function() {
        return self._status === STATUS_CLOSED;
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

    if (this._status !== STATUS_OPEN_IDLE) {
        throw new Error('Can not send messages while driver is not connected');
    }

    var self     = this,
        cemi     = new KnxIp.Cemi('L_Data.req', message),
        sequence = this._sequence++,
        request  = new KnxIp.TunnelingRequest(this._channelId, sequence, cemi);

    this._requests[sequence] = {
        cemi: cemi,
        callback: callback,
        acked: false,
        repeated: false
    };

    this._sendUntil(request, function() {
        return self._requests[sequence].acked;
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

    switch (true) {
        case packet instanceof KnxIp.TunnelingRequest:

            if (!this.isConnected() || packet.getChannelId() !== this._channelId) {
                return;
            }

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
            } else {
                this._requests[packet.getSequence()].repeated = true;
                this._requests[packet.getSequence()].callback.call(this);
            }
            break;
        case packet instanceof KnxIp.TunnelingAck:
            this._onTunnelingAck(packet);
            break;
        case packet instanceof KnxIp.ConnectionResponse:
            this._onConnectionResponse(packet);
            break;
        case packet instanceof KnxIp.DisconnectRequest:
            this._socketSend(new KnxIp.DisconnectResponse(packet.getChannelId(), 0));
        case packet instanceof KnxIp.DisconnectResponse:
            this._status = STATUS_CLOSED;
            this.emit('disconnect', packet);
    }
};

/**
 * Called when a connection response is received. This mehtod will set the current
 * status and stores the received channelId. The sequence counter will be resetted to 0
 * and heartbeat is started. After all a connected event is emitted and the received
 * response packet is passed to the event listeners.
 *
 * @param {Driver.KnxIp.ConnectionResponse} response
 * @fires connected
 * @private
 */
KnxIpDriver.prototype._onConnectionResponse = function(response) {
    var endpoint = response.getEndpoint(),
        logMsg = 'Connected to Knx/IP Interface';

    if (this._status === STATUS_OPEN_IDLE) {
        return;
    }

    if (endpoint) {
        logMsg += " on " + endpoint.getAddress() + ":" + endpoint.getPort();
    }

    this._channelId = response.getChannelId();
    this._sequence = 0;
    this._status = STATUS_OPEN_IDLE;
    this.emit('connected', response);
    this._startHeartbeat();

    this._logger.info(logMsg);
};

/**
 * Called when a tunneling ack is received.
 *
 * @param {Driver.KnxIp.TunnelingAck} packet
 * @private
 */
KnxIpDriver.prototype._onTunnelingAck = function(packet) {

    var requestData = this._requests[packet.getSequence()],
        message = requestData.cemi.getMessage();

    this._logger.verbose("Send Message to " + message.getDestination() + ": " + message.getData());
    requestData.acked = true;

    if (requestData.acked && requestData.repeated && requestData.callback) {
        requestData.callback.call(this);
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
        request = new KnxIp.TunnelingRequest(this._channelId, sequence, clone),
        requestData = {
            cemi: clone,
            callback: callback,
            acked: false,
            repeated: true
        };

    clone.setMessageCode("L_Data.con");

    this._requests[sequence] = requestData;

    this._sendUntil(request, function() {
        return requestData.acked;
    });
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
 * @param {Function} validator Function that returns true if sending should stop
 * @private
 */
KnxIpDriver.prototype._sendUntil = function(packet, validator) {
    var self = this,
        repeatsLeft = this._options.maxRepeats,
        timeout;

    function checkMaxAttempsAndResend () {

        if (validator()) {
            return;
        }

        self._socketSend(packet);

        if (--repeatsLeft > 0) {
            timeout = setTimeout(checkMaxAttempsAndResend, 1000);
        }
    }

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

    this._socketSend(stateRequest);

    self._heartbeatTimeout = setTimeout(function() {
        self._startHeartbeat();
    }, 60000);
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