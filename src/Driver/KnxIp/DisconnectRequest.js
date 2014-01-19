var util = require('util'),
    Packet = require('./Packet.js'),
    Hpai = require('./Hpai');

/**
 * @class Driver.KnxIp.DisconnectRequest
 * @extend Driver.KnxIp.Packet
 * @constructor
 * @param {Driver.KnxIp.Hpai} endpoint Connection endpoint
 * @param {Number} channelId
 */
function DisconnectRequest(endpoint, chanelId) {
    this._endpoint = endpoint;
    this._chanelId = chanelId;

    this._serviceType = 0x0209;
}
util.inherits(DisconnectRequest, Packet);

/**
 * Returns packet data bytes
 *
 * @returns {Array}
 */
DisconnectRequest.prototype.getData = function() {
    var endpoint = this._endpoint.toArray(),
        chanelId = this._chanelId;

    return [chanelId, 0].concat(endpoint);
};

/**
 * Return the current chanel ID
 *
 * @returns {Number}
 */
DisconnectRequest.prototype.getChannelId = function() {
    return this._chanelId;
};

/**
 * Returns the current Endpoint
 *
 * @returns {Driver.KnxIp.Hpai}
 */
DisconnectRequest.prototype.getEndpoint = function() {
    return this._endpoint;
};

/**
 * Reads the given buffer and creates a new DisconnectRequest
 * instance based on the infromations from the buffer.
 *
 * @param {buffer.Buffer} buf
 * @returns {Driver.KnxIp.DisconnectRequest}
 */
DisconnectRequest.parse = function(buf) {
    var channelId = buf[6],
        endpoint = Hpai.parse(buf.slice(8, 16));

    return new DisconnectRequest(endpoint, channelId);
};

module.exports = DisconnectRequest;