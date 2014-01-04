var Packet = require('./Packet.js'),
    Cemi = require('./Cemi'),
    util   = require('util');

/**
 * Object representation for a tunneling acknowledgement. Its bytes are used
 * to reply for a received tunneling request. So, the sender becomes notified
 * about a successful transmission.
 *
 * {@img knx_ip_tunneling_request.png Schema of a knx ip tunneling request}
 *
 * @class Driver.KnxIp.TunnelingRequest
 * @extends Driver.KnxIp.Packet
 * @param {Number} channelId
 * @param {Number} sequence Next sequence count
 * @param {Driver.KnxIp.Cemi} cemi
 * @constructor
 */
function TunnelingRequest(channelId, sequence, cemi) {
    this._serviceType = 0x0420;
    this._channelId = channelId;
    this._sequence = sequence;
    this._cemi = cemi;
}

util.inherits(TunnelingRequest, Packet);

TunnelingRequest.prototype.getData = function() {
    var header = [
        4, // connection header length
        this._channelId,
        this._sequence,
        0 // reserved
    ];

    return header.concat(this._cemi.toArray());
};

TunnelingRequest.prototype.getChannelId = function() {
    return this._channelId;
};

TunnelingRequest.prototype.getSequence = function() {
    return this._sequence;
};

TunnelingRequest.prototype.getCemi = function() {
    return this._cemi;
};

TunnelingRequest.parse = function(buffer) {
    var channelId = buffer[7],
        sequence = buffer[8],
        msg = Cemi.parse(buffer.slice(10));

    return new TunnelingRequest(channelId, sequence, msg);
};

module.exports = TunnelingRequest;