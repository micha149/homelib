var serviceTypeToName,
    serviceNameToType,
    Buffer = require('buffer').Buffer,
    UnexpectedValueError = require('../../Error/UnexpectedValueError'),
    invert = require('underscore').invert;

serviceTypeToName = {
    0x0201: "search.request",
    0x0202: "search.response",
    0x0203: "description.request",
    0x0204: "description.response",
    0x0205: "connection.request",
    0x0206: "connection.response",
    0x0207: "connectionstate.request",
    0x0208: "connectionstate.response",
    0x0209: "disconnect.request",
    0x020a: "disconnect.response",
    0x0310: "configuration.request",
    0x0311: "configuration.ack",
    0x0420: "tunneling.request",
    0x0421: "tunneling.ack",
    0x0530: "routing.indication",
    0x0531: "routing.lostmessage"
};

serviceNameToType = invert(serviceTypeToName);

// Turn a value into a formatted hex string
function toHex(n) {
    if (n < 16) {
        return '0' + n.toString(16);
    }
    return n.toString(16);
}

/**
 * The packet class represents a data packet which is used to be sent
 * to an udp socket. The packet has a 6 byte header which contains the
 * given service type. The given data bytes follow after the header.
 *
 * {@img knx_ip_packet.png Schema of a knx ip packet}
 *
 * @class Driver.KnxIp.Packet
 *
 * @param {Number|String} serviceType Two byte service type identifier or service name as string
 * @param {Array} data Array with packet data
 * @constructor
 */
function Packet(serviceType, data) {

    if (typeof serviceType === 'string') {
        if (!serviceNameToType[serviceType]) {
            throw new UnexpectedValueError('Unknown service name \'' + serviceType + '\'');
        }
        serviceType = serviceNameToType[serviceType];
    }

    this._serviceType = serviceType & 0xffff;
    this._data = data || [];
}

/**
 * Returns a new buffer instance which represents this knx ip packet.
 *
 * @method toBuffer
 * @returns {buffer.Buffer}
 */
Packet.prototype.toBuffer = function() {
    var i,
        data = this.getData(),
        serviceType = this._serviceType,
        totalLength = 6 + data.length,
        buffer = new Buffer(totalLength);

    buffer[0] = 0x06; // header length
    buffer[1] = 0x10; // protocol version
    buffer[2] = (serviceType >> 8) & 0xff;
    buffer[3] = serviceType & 0xff;
    buffer[4] = (totalLength >> 8) & 0xff;
    buffer[5] = totalLength & 0xff;

    for (i = 0; i < data.length; i++) {
        buffer.writeUInt8(data[i], i + 6);
    }

    return buffer;
};

/**
 * Returns a string representation for this packet. This method is
 * automatically called when a packet instance is passed to console
 * methods.
 *
 * @method inspect
 * @returns {String}
 */
Packet.prototype.inspect = function() {
    var i,
        data = this.getData(),
        out = [];

    for (i = 0; i < data.length; i++) {
        out.push(toHex(data[i]));
    }

    return '<KnxIpPacket (' + this.getServiceName() + ') ' + out.join(' ') + '>';
};

/**
 * Returns service type value
 *
 * @method getServiceType
 * @returns {Number}
 */
Packet.prototype.getServiceType = function() {
    return this._serviceType;
};

/**
 * Returns a human readable version of the service type.
 *
 * @method getServiceName
 * @return {String}
 */
Packet.prototype.getServiceName = function() {
    var high, low,
        serviceType = this._serviceType,
        string = serviceTypeToName[serviceType];

    if (!string) {
        high = (serviceType >> 8);
        low  = (serviceType & 0xff);
        string = "0x" + toHex(high) + toHex(low);
    }

    return string;
};

/**
 * Returns packet data
 *
 * @method getData
 * @returns {Array} Array of bytes
 */
Packet.prototype.getData = function() {
    return this._data;
};

/**
 * Static method to parse an array of buffer into an package object. If the
 * given data does not correspond to the specification an exception will be
 * thrown.
 *
 * @method parse
 * @param {Array|buffer.Buffer} raw Data to parse
 * @returns {Driver.KnxIp.Packet}
 * @static
 */
Packet.parse = function(raw) {
    if (raw instanceof Buffer) {
        raw = raw.toJSON();
    }

    if (raw[0] !== 0x06) {
        throw new UnexpectedValueError('Expected header length of 6, but ' + raw[0] + ' given.');
    }

    if (raw[1] !== 0x10) {
        throw new UnexpectedValueError('Unsupported protocol version. Only 1.0 is supported.');
    }

    if (((raw[4] << 8) | raw[5]) !== raw.length) {
        throw new UnexpectedValueError('Data has not correct length. Expected ' + ((raw[4] << 8) | raw[5]) + ' bytes');
    }

    return new Packet((raw[2] << 8 | raw[3]), raw.slice(6));
};

/**
 * Turns a received buffer into the equivalent object representation.
 *
 * @method factory
 * @param {buffer.Buffer} buffer Received datagram buffer
 * @returns {Driver.KnxIp.Packet}
 * @static
 */
Packet.factory = function(buffer) {

    var serviceType = buffer[2] << 8 | buffer[3];

    switch(serviceType) {
        case 0x0420:
            return require('./TunnelingRequest.js').parse(buffer);
        case 0x0206:
            return require('./ConnectionResponse.js').parse(buffer);
        case 0x0207:
            return require('./ConnectionStateRequest.js').parse(buffer);
        case 0x0208:
            return require('./ConnectionStateResponse.js').parse(buffer);
        case 0x0421:
            return require('./TunnelingAck.js').parse(buffer);
        case 0x0209:
            return require('./DisconnectRequest.js').parse(buffer);
        case 0x020a:
            return require('./DisconnectResponse.js').parse(buffer);
        default:
            return Packet.parse(buffer);
    }
};

module.exports = Packet;