var util = require('util'),
    AbstractType = require('./AbstractType'),
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    _ = require('underscore');

function TimeType() {
    AbstractType.apply(this, arguments);
}
util.inherits(TimeType, AbstractType);

TimeType.prototype._type = "PDT_TIME";

TimeType.prototype.decode = function(data) {
    var date = new Date(),
        dayOffset = ((data[0] >> 5) - date.getDay()) % 7;

    date.setHours(data[0] & 31);
    date.setMinutes(data[1] & 63);
    date.setSeconds(data[2] & 63);
    date.setDate(date.getDate() + dayOffset);

    return date;
};

TimeType.prototype.encode = function(date) {
    var data = [];
    data[0] = (date.getDay() << 5) | date.getHours();
    data[1] = date.getMinutes();
    data[2] = date.getSeconds();
    return data;
};

module.exports = TimeType;