var _ = require('underscore'),
    UnexpectedValueError = require('./Error/UnexpectedValueError');

/**
 * Object representation for a group address. An instance can be created with
 * a serialized group address string, by a number or an array of two bytes.
 *
 *             +-----------------------+-----------------------+
 *             | OCTET 0 (high byte)   |  OCTET 1 (low byte)   |
 *             +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *     16 bits | 7| 6| 5| 4| 3| 2| 1| 0| 7| 6| 5| 4| 3| 2| 1| 0|
 *             +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *             |  |   Main-   | Middle-|       Sub Group       |
 *             +--+-----------+--------+-----------------------+
 *             |  |   Main-   |           Sub Group            |
 *             +--+-----------+--------+-----------------------+
 *
 * @constructor
 * @param {String|Number|Number[]} address
 */
var GroupAddress = function(address) {
    if (!address) {
        throw new Error('Missing address parameter');
    }

    if(_.isString(address)) {
        address = this._parseAddress(address);
    }

    if(_.isArray(address) && address.length === 2) {
        address = (address[0] << 8) | address[1];
    }

    if(!_.isNumber(address) || address > 65535) {
        throw new UnexpectedValueError('Given parameter can not be used as group address value');
    }

    this.address = address;
};

/**
 * Parses a given string. Group address strings has to be structured by slashes.
 * A group address can consist of three or two parts.
 *
 * @param {string} str Group address
 * @returns {Number} Numbervalue for given address
 * @private
 */
GroupAddress.prototype._parseAddress = function (str) {
    var m = str.match(/^(\d*)\/(\d*)(?:\/(\d*))?$/);

    if (m && typeof m[3] !== "undefined" && m[1] < 16 && m[2] < 8 && m[3] < 256) {

        return (m[1] << 11) | (m[2] << 8) | m[3];
        
    } else if (m && typeof m[3] === "undefined" && m[1] < 16 && m[2] < 2048) {

        return (m[1] << 11) | m[2];
    }
    
    throw new UnexpectedValueError(str + " is not a valid group address.");
};

/**
 * Returns group address value as a single Number.
 *
 * @returns {Number}
 */
GroupAddress.prototype.getNumber = function() {
    return this.address;
};

/**
 * Returns the group address value as an array of two bytes. This will be
 * used to create buffers for communication purposes.
 *
 * @returns {Number[]}
 */
GroupAddress.prototype.getRaw = function() {
    var addr = this.address,
        high = (addr & 65280) >> 8,
        low = addr & 255;

    return [high, low];
};

/**
 * Returns a string representation like "1/4/34" for this address object.
 *
 * @returns {string}
 */
GroupAddress.prototype.toString = function() {
    var number = this.address,
        main = (number & 30720) >> 11,
        middle = (number & 1792) >> 8,
        sub = number & 255;

    return [main, middle, sub].join('/');
};

module.exports = GroupAddress;