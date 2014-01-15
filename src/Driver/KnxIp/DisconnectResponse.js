var util = require('util'),
    Hpai = require('./Hpai.js'),
    Packet = require('./Packet.js'),
    Buffer = require('buffer').Buffer;

/**
 *
 * @class Driver.KnxIp.DisconnectResponse
 * @extend Driver.KnxIp.Packet
 *
 * @constructor
 * @param {Number} channelId
 * @param {Number} status
 * @param {Driver.KnxIp.Hpai} endpoint
 */
function DisconnectResponse(channelId, status) {

    this._channelId = channelId;
    this._status = status;

    this._serviceType = 0x020a;
}
util.inherits(DisconnectResponse, Packet);

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
DisconnectResponse.prototype.getChannelId = function() {
    return this._channelId;
};

/**
 * Returns the endpoint part of the response
 * @returns {Driver.KnxIp.Hpai}
 */
DisconnectResponse.prototype.getEndpoint = function() {
    return this._endpoint;
};

/**
 * Returns the status code of the response
 * @returns {Number}
 */
DisconnectResponse.prototype.getStatus = function() {
    return this._status;
};

/**
 * Returns packet data bytes
 *
 * @returns {Array}
 */
DisconnectResponse.prototype.getData = function() {
    var data = [];

    data.push(this._channelId);
    data.push(this._status);

    return data;
};

/**
 * Parses a buffer to an instance of ConnectionResponse
 *
 * @param {buffer.Buffer|Array} buf
 * @returns {Driver.KnxIp.DisconnectResponse}
 */
DisconnectResponse.parse = function(buf) {
    var channelId = buf[6],
        status = buf[7];

    return new DisconnectResponse(channelId, status);
};

module.exports = DisconnectResponse;