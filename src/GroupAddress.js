

var GroupAddress = function(address, type, title) {
    if (!address) {
        throw new Error('Missing address parameter');
    }
    if (!type) {
        throw new Error('Missing type parameter');
    }
    
    this.address = address;
    this.type    = type;
    this.title   = title || null;
};

/**
 *            +-----------------------+-----------------------+
 *            | OCTET 0 (high byte)   |  OCTET 1 (low byte)   |
 *            +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *    16 bits | 7| 6| 5| 4| 3| 2| 1| 0| 7| 6| 5| 4| 3| 2| 1| 0|
 *            +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *            |  |   Main-   |           Sub Group            |
 *            +--+-----------+--------+-----------------------+
 *            |  |   Main-   | Middle-|       Sub Group       |
 *            +--+-----------+--------+-----------------------+
 */
GroupAddress.prototype.parseAddress = function (str) {
    var a, b, c,
        m = str.match(/^(\d*)\/(\d*)(?:\/(\d*))?$/),
        result = -1;

    if (m && typeof m[3] !== "undefined" && m[1] < 16 && m[2] < 8 && m[3] < 256) {    
        a = (m[1] & 0x01f) << 11;
        b = (m[2] & 0x07) << 8;
        c = m[3] & 0xff;
        result = a | b | c;
    } else if (m && m[1] < 16 && m[2] < 2048) {
        a = (m[1] & 0x7f) << 8;
        b = m[2] & 0xff;
        result = a | b;
    }

    if (result > -1) {
        return result;
    }
    
    throw new Error(str + " is not a valid group address.");
}

module.exports = GroupAddress;