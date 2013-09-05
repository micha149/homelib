var util = require('util'),
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    exp = /^([+-]?)\s*(?:(\d+)w)?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?\s*$/;

/**
 * @class Timer.Duration
 * @param {Number|String} dur Duration in seconds or duration string like '2h 24m'
 * @constructor
 */
function Duration(dur) {

    var matches;

    if (typeof dur === "string") {
        matches = dur.match(exp);
        if (matches) {
            dur = 0;

            dur += (matches[6] || 0) * 1000; // seconds
            dur += (matches[5] || 0) * 60000; // minutes
            dur += (matches[4] || 0) * 3600000; // hours
            dur += (matches[3] || 0) * 86400000; // days
            dur += (matches[2] || 0) * 604800000; // weeks

            dur *= matches[1] === '-' ? -1 : 1;
        }
    }

    if (typeof dur !== "number") {
        throw new UnexpectedValueError("Expected duration string or number");
    }

    this.duration = dur;
}

Duration.prototype.valueOf = function() {
    return this.duration;
};


Duration.prototype.toString = function() {
    var rest = Math.abs(this.duration),
        str = this.duration < 0 ? "-" : "",
        key;

    var defs = {
        "w": 604800000,
        "d": 86400000,
        "h": 3600000,
        "m": 60000,
        "s": 1000
    };

    for (key in defs) {
        if (rest >= defs[key]) {
            str += Math.floor(rest / defs[key]) + key + " ";
            rest = rest % defs[key];
        }
    }

    return str.trim();
};

module.exports = Duration;