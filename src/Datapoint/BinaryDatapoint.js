var util = require('util'),
    AbstractDatapoint = require('./AbstractDatapoint'),
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    _ = require('underscore');

function BinaryDatapoint(options) {
    AbstractDatapoint.apply(this, arguments);

    this._valueMap = options.valueMap;
    this._valueMapInverted = _.invert(this._valueMap);
}
util.inherits(BinaryDatapoint, AbstractDatapoint);

BinaryDatapoint.prototype._type = "PDT_BINARY_INFORMATION";

BinaryDatapoint.prototype.validate = function(value) {
    return value === 1 || value === 0;
};

BinaryDatapoint.prototype.parse = function(value) {

    if (!this._valueMapInverted[value]) {
        throw new UnexpectedValueError(value + ' could not be parsed to DPT_Switch value');
    }

    return [parseInt(this._valueMapInverted[value], 10)];
};

BinaryDatapoint.prototype.transform = function(data) {

    if (data.length !== 1 || !this._valueMap[data[0]]) {
        throw new UnexpectedValueError('Given data could not be transformed to readable string');
    }

    return this._valueMap[data[0]];
};

module.exports = BinaryDatapoint;