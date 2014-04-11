var AbstractModule = require('./AbstractModule'),
    Datapoint = require('../Datapoint/Datapoint'),
    util = require('util');

function IfElseModule() {

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
util.inherits(IfElseModule, AbstractModule);

IfElseModule.prototype.start = function() {
    var ifInput = this._inputs.if,
        elseInput = this._inputs.else,
        valueOutput = this._outputs.value;

    this._inputs.condition.subscribe(function(condition) {

        condition = condition.toLowerCase ? condition.toLowerCase() : condition;

        if (condition === "on") {
            elseInput.unsubscribe(valueOutput);
            ifInput.subscribe(valueOutput);
        } else {
            ifInput.unsubscribe(valueOutput);
            elseInput.subscribe(valueOutput);
        }
    });
};

module.exports = IfElseModule;