var isArray = require('underscore').isArray;

/**
 * Object representation for a group address. An instance can be created with
 * a serializes group address. This address will be stored as 2 bytes and can
 * be used to build a bus telegram.
 * Each group address needs a datatype instance for validating data before
 * sending. An optional title can be stored for organization purposes.
 */
function PhysicalAddress(address) {
    if (isArray(address) && address.length === 2 && address[0] < 256 && address[1] < 256) {
        this._address = address;
        return;
    }
    this._address = this.parseAddress(address);
}

PhysicalAddress.prototype.getRaw = function() {
    return this._address;
};

/**
 * Parses a physical address string into two bytes
 *
 *     +------------------------------------+------------------------------------+
 *     |         OCTET 0 (high byte)        |         OCTET 1 (low byte)         |
 *     +-----+----+----+----+---+---+---+---+-----+----+----+----+---+---+---+---+
 *     | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
 *     +-----+----+----+----+---+---+---+---+-----+----+----+----+---+---+---+---+
 *     |         Area       |      Line     |               Member               |
 *     +--------------------+---------------+------------------------------------+
 *
 * @param  {String} str
 * @return {Number[]} Array with two bytes
 */
PhysicalAddress.prototype.parseAddress = function (str) {
    var m = str.match(/^(\d*)\.(\d*)\.(\d*)$/),
        result = [];

    if (m && m[1] < 16 && m[2] < 16 && m[3] < 256) {

        result[0] = ((m[1] & 15) << 4) | (m[2] & 15);
        result[1] = m[3] & 255;
        
        return result;
    }
    
    throw new Error(str + " is not a valid physical address.");
};

/**
 * Returns a string representation like "1.4.34" for this address object.
 *
 * @returns {string}
 */
PhysicalAddress.prototype.toString = function() {
    var bytes = this._address,
        area = (bytes[0] & 240) >> 4,
        line = (bytes[0] & 15),
        member = bytes[1];

    return [area, line, member].join('.');
};

module.exports = PhysicalAddress;