var AbstractModule = require('./AbstractModule'),
    Datapoint = require('../Datapoint/Datapoint'),
    util = require('util');

function ValueModule(type, value) {

    this._value = value;

    this._outputs = {
        'value': Datapoint.create(type)
    };

    this._inputs = {
    };

    AbstractModule.apply(this, arguments);
}
util.inherits(ValueModule, AbstractModule);

ValueModule.prototype.start = function() {
    this._outputs.value.publish(this._value);
};

module.exports = ValueModule;