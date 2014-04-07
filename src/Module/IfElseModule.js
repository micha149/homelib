var AbstractModule = require('./AbstractModule'),
    Datapoint = require('../Datapoint/Datapoint'),
    util = require('util');

function ValueModule() {

    this._outputs = {
        'value': Datapoint.create()
    };

    this._inputs = {
        'condition': Datapoint.create("1.001"),
        'if': Datapoint.create(),
        'else': Datapoint.create()
    };

    AbstractModule.apply(this, arguments);
}
util.inherits(ValueModule, AbstractModule);

ValueModule.prototype.start = function() {
    var ifInput = this._inputs.if,
        elseInput = this._inputs.else,
        valueOutput = this._outputs.value;

    this._inputs.condition.subscribe(function(condition) {
        if (condition === "On") {
            elseInput.unsubscribe(valueOutput);
            ifInput.subscribe(valueOutput);
        } else {
            ifInput.unsubscribe(valueOutput);
            elseInput.subscribe(valueOutput);
        }
    });
};

module.exports = ValueModule;