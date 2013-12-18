var util = require('util'),
    Packet = require('./Packet.js'),
    Hpai = require('./Hpai.js'),
    Buffer = require('buffer').Buffer;

/**
 * Connection state request
 *
 * @class Driver.KnxIp.ConnectionStateRequest
 * @extend Driver.KnxIp.Packet
 * @constructor
 * @param {Number} channelId Channel ID
 * @param {Driver.KnxIp.Hpai} endpoint Control endpoint
 */
function ConnectionStateRequest(channelId, endpoint) {
    this._channelId = channelId;
    this._endpoint = endpoint;

    this._data = [
        0 // data length
    ];

    this._serviceType = 0x0207;
}
util.inherits(ConnectionStateRequest, Packet);

/**
 * Returns channel ID
 *
 * @returns {Number}
 */
ConnectionStateRequest.prototype.getChannelId = function() {
    return this._channelId;
};

/**
 * Returns control endpoint
 *
 * @returns {Driver.KnxIp.Hpai}
 */
ConnectionStateRequest.prototype.getEndpoint = function() {
    return this._endpoint;
};

/**
 * Returns packet data bytes
 *
 * @returns {Array}
 */
ConnectionStateRequest.prototype.getData = function() {
    var result = [this._channelId],
        endpoint = this._endpoint.toArray(),
        data = this._data;

    return result.concat(data, endpoint);
};

/**
 * Parses a buffer to an instance of ConnectionStateRequest
 *
 * @param {Buffer} buf
 * @returns {Driver.KnxIp.ConnectionStateRequest}
 */
ConnectionStateRequest.parse = function(buf) {
    var channelId = buf[6],
        address = buf[10] + "." + buf[11] + "." + buf[12] + "." + buf[13],
        port = (buf[14] << 8) + buf[15],
        endpoint = new Hpai(address, port);

    return new ConnectionStateRequest(channelId, endpoint);
};

module.exports = ConnectionStateRequest;