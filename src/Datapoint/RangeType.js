var util = require('util'),
    AbstractType = require('./AbstractType'),
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    _ = require('underscore');

function RangeType(options) {
    AbstractType.apply(this, arguments);
    this._min = options.min;
    this._max = options.max;
    this._resolution = (this._max - this._min) / 255;
}
util.inherits(RangeType, AbstractType);

RangeType.prototype._type = "PDT_TIME";

RangeType.prototype.decode = function(data) {
    return data[0] * this._resolution + this._min;
};

RangeType.prototype.encode = function(data) {
    return [Math.round((data - this._min) / this._resolution)];
};

module.exports = RangeType;