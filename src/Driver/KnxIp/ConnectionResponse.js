var util = require('util'),
    Hpai = require('./Hpai.js'),
    Packet = require('./Packet.js'),
    Buffer = require('buffer').Buffer;

/**
 *
 * @class Driver.KnxIp.ConnectionResponse
 * @extend Driver.KnxIp.Packet
 *
 * @constructor
 * @param {Number} channelId
 * @param {Number} status
 * @param {Driver.KnxIp.Hpai} endpoint
 */
function ConnectionResponse(channelId, status, endpoint) {

    this._channelId = channelId;
    this._status = status;
    this._endpoint = endpoint;

    this._data = [
        4, // data length
        0x04, // Tunnel connection
        0x10, // ?
        0x01 // ?
    ];

    this._serviceType = 0x0206;
}
util.inherits(ConnectionResponse, Packet);

/**
 * @property {Number} _channelId
 */

/**
 * @property {Number} _status
 */

/**
 * @property {Driver.KnxIp.Hpai} _endpoint
 */

/**
 * Returns channel id of the response
 *
 * @returns {Number}
 */
ConnectionResponse.prototype.getChannelId = function() {
    return this._channelId;
};

/**
 * Returns the endpoint part of the response
 * @returns {Driver.KnxIp.Hpai}
 */
ConnectionResponse.prototype.getEndpoint = function() {
    return this._endpoint;
};

/**
 * Returns the status code of the response
 * @returns {Number}
 */
ConnectionResponse.prototype.getStatus = function() {
    return this._status;
};

/**
 * Returns packet data bytes
 *
 * @returns {Array}
 */
ConnectionResponse.prototype.getData = function() {
    var data = [];

    data.push(this._channelId);
    data.push(this._status);
    data.push.apply(data, this._endpoint.toArray());
    data.push.apply(data, this._data);

    return data;
};

/**
 * Parses a buffer to an instance of ConnectionResponse
 *
 * @param {buffer.Buffer|Array} buf
 * @returns {Driver.KnxIp.ConnectionResponse}
 */
ConnectionResponse.parse = function(buf) {
    var channelId = buf[6],
        status = buf[7],
        address = buf[10] + "." + buf[11] + "." + buf[12] + "." + buf[13],
        port = (buf[14] << 8) + buf[15],
        endpoint = new Hpai(address, port);

    return new ConnectionResponse(channelId, status, endpoint);
};

module.exports = ConnectionResponse;