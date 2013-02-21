/**
 * Object representation for a group address. An instance can be created with
 * a serializes group address. This address will be stored as 2 bytes and can
 * be used to build a bus telegram.
 * Each group address needs a datatype instance for validating data before
 * sending. An optional title can be stored for organization purposes.
 */
var GroupAddress = function(address, type, title) {
    if (!address) {
        throw new Error('Missing address parameter');
    }
    if (!type) {
        throw new Error('Missing type parameter');
    }
    
    this.address = address;
    this.type    = type;
    this.title   = title || "";
}

/**
 *            +-----------------------+-----------------------+
 *            | OCTET 0 (high byte)   |  OCTET 1 (low byte)   |
 *            +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *    16 bits | 7| 6| 5| 4| 3| 2| 1| 0| 7| 6| 5| 4| 3| 2| 1| 0|
 *            +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *            |  |   Main-   | Middle-|       Sub Group       |
 *            +--+-----------+--------+-----------------------+
 *            |  |   Main-   |           Sub Group            |
 *            +--+-----------+--------+-----------------------+
 */
GroupAddress.prototype.parseAddress = function (str) {
    var m = str.match(/^(\d*)\/(\d*)(?:\/(\d*))?$/),
        result = [];

    if (m && typeof m[3] !== "undefined" && m[1] < 16 && m[2] < 8 && m[3] < 256) {    

        result[0] = ((m[1] & 15) << 3) | (m[2] & 7);
        result[1] = m[3] & 0xff;
        
    } else if (m && m[1] < 16 && m[2] < 2048) {

        result[0] = ((m[1] & 15) << 3) | ((m[2] & 1792) >> 8);
        result[1] = m[2] & 255;
        
    }

    if (result.length) {
        return result;
    }
    
    throw new Error(str + " is not a valid group address.");
}

GroupAddress.prototype.getRaw = function() {
    return this.address;
}

module.exports = GroupAddress;