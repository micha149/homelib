var UnexpectedValueError = require('../../Error/UnexpectedValueError'),
    Buffer = require('buffer').Buffer;

IPADDR = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

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

Hpai.prototype._assertAddress = function (address) {
    return (typeof address === "string") && address.match(IPADDR);
}

Hpai.prototype.toBuffer = function() {
    var buf = new Buffer(8),
        adr = this.address.split(".");

    buf[0] = 0x08;
    buf[1] = this.protocol === "udp" ? 0x01 : 0x00;
    buf[2] = parseInt(adr[0], 10);
    buf[3] = parseInt(adr[1], 10);
    buf[4] = parseInt(adr[2], 10);
    buf[5] = parseInt(adr[3], 10);
    buf[6] = (this.port & 0xff00) >> 8;
    buf[7] = (this.port & 0xff);

    return buf;
}

module.exports = Hpai;