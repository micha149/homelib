var util = require('util'),
    UnexpectedValueError = require('../Error/UnexpectedValueError');

exp = /^([+-]?)\s*(?:(\d+)w)?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?\s*$/;

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
}


module.exports = Duration;