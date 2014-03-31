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
 */
function ConnectionStateResponse(channelId, status) {

    this._channelId = channelId;
    this._status = status;

    this._serviceType = 0x0208;
}
util.inherits(ConnectionStateResponse, Packet);

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
ConnectionStateResponse.prototype.getChannelId = function() {
    return this._channelId;
};

/**
 * Returns the status code of the response
 * @returns {Number}
 */
ConnectionStateResponse.prototype.getStatus = function() {
    return this._status;
};

/**
 * Returns packet data bytes
 *
 * @returns {Array}
 */
ConnectionStateResponse.prototype.getData = function() {
    var data = [];

    data.push(this._channelId);
    data.push(this._status);

    return data;
};

/**
 * Parses a buffer to an instance of ConnectionResponse
 *
 * @param {buffer.Buffer|Array} buf
 * @returns {Driver.KnxIp.ConnectionResponse}
 */
ConnectionStateResponse.parse = function(buf) {
    var channelId = buf[6],
        status = buf[7];

    return new ConnectionStateResponse(channelId, status);
};

module.exports = ConnectionStateResponse;