var Packet = require('./Packet.js'),
    util   = require('util');

/**
 * Object representation for a tunneling acknowledgement. Its bytes are used
 * to reply for a received tunneling request. So, the sender becomes notified
 * about a successful transmission.
 *
 * @class Driver.KnxIp.TunnelingRequest
 * @param {Number} channelId
 * @param {Number} sequence Next sequence count
 * @param {Message} message
 * @constructor
 */
function TunnelingRequest(channelId, sequence, message) {
    this._serviceType = 0x0420;
    this._channelId = channelId;
    this._sequence = sequence;
    this._message = message;
}
util.inherits(TunnelingRequest, Packet);

TunnelingRequest.prototype.getData = function() {
    var header = [
        4, // connection header length
        this._channelId,
        this._sequence,
        0 // reserved
    ];

    return header.concat(this._message.getRaw());
}

TunnelingRequest.prototype.getChannelId = function() {
    return this._channelId;
}

TunnelingRequest.prototype.getSequence = function() {
    return this._sequence;
}

TunnelingRequest.prototype.getMessage = function() {
    return this._message;
}

module.exports = TunnelingRequest;