var util = require('util'),
    AbstractType = require('./AbstractType'),
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    _ = require('underscore');

function BinaryType(options) {
    var self = this;

    AbstractType.apply(this, arguments);

    this._valueMap = {};
    this._valueMapInverted = {};

    _.each(options.valueMap, function(value, key) {
        if (value.toLowerCase) {
            value = value.toLowerCase();
        }
        self._valueMap[key] = value;
        self._valueMapInverted[value] = key;
    });
}
util.inherits(BinaryType, AbstractType);

BinaryType.prototype._type = "PDT_BINARY_INFORMATION";

BinaryType.prototype.validate = function(value) {
    return value === 1 || value === 0;
};

BinaryType.prototype.parse = function(value) {

    if (value.toLowerCase) {
        value = value.toLowerCase();
    }

    if (!this._valueMapInverted[value]) {
        throw new UnexpectedValueError(value + ' could not be parsed to DPT_Switch value');
    }

    return [parseInt(this._valueMapInverted[value], 10)];
};

BinaryType.prototype.transform = function(data) {

    if (data.length !== 1 || !this._valueMap[data[0]]) {
        throw new UnexpectedValueError('Given data could not be transformed to readable string');
    }

    return this._valueMap[data[0]];
};

module.exports = BinaryType;