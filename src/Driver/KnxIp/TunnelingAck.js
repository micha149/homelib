var Packet = require('./Packet.js'),
    util   = require('util');

/**
 * Object representation for a tunneling acknowledgement. Its bytes are used
 * to reply for a received tunneling request. So, the sender becomes notified
 * about a successful transmission.
 *
 * @class Driver.KnxIp.TunnelingAck
 * @param {Number} channelId
 * @param {Number} sequence Next sequence count
 * @constructor
 */
function TunnelingAck(channelId, sequence, status) {
    var length = 4;

    status = status || 0x00;

    this._serviceType = 0x0421;
    this._data = [length, channelId & 0xff, sequence & 0xff, status & 0xff]
}
util.inherits(TunnelingAck, Packet);

module.exports = TunnelingAck;