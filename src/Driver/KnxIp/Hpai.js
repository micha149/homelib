var UnexpectedValueError = require('../../Error/UnexpectedValueError'),
    Buffer = require('buffer').Buffer;

IPADDR = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * @class Driver.KnxIp.Hpai
 * @param {String} address IPv4 Address
 * @param {Number} port Port number
 * @constructor
 */
function Hpai(address, port) {

    if (!this._assertAddress(address)) {
        throw new UnexpectedValueError('Given address matches not an IPV4 address');
    }

    if (typeof port !== "number") {
        throw new UnexpectedValueError('Given port must be a number');
    }

    if (port > 65535) {
        throw new UnexpectedValueError('Port number must be smaller than 65535');
    }

    this.protocol = "udp";
    this.address = address;
    this.port = port;
}

Hpai.prototype.getAddress = function() {
    return this.address;
};

Hpai.prototype.getPort = function() {
    return this.port;
};

Hpai.prototype._assertAddress = function (address) {
    return (typeof address === "string") && address.match(IPADDR);
};

Hpai.prototype.toBuffer = function() {
    var buf = new Buffer(this.toArray());
    return buf;
};

Hpai.prototype.toArray = function() {
    var adr = this.address.split(".");

    return [
        0x08,
        this.protocol === "udp" ? 0x01 : 0x00,
        parseInt(adr[0], 10),
        parseInt(adr[1], 10),
        parseInt(adr[2], 10),
        parseInt(adr[3], 10),
        (this.port & 0xff00) >> 8,
        (this.port & 0xff)
    ];
};

module.exports = Hpai;