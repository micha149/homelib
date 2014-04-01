var _ = require("underscore"),
    Datapoint = require("../Datapoint/Datapoint"),
    UnexpectedValueError = require('../Error/UnexpectedValueError');

function AbstractModule(str) {

    this._outputs = this._outputs || {};
    this._inputs = this._inputs || {};
}

AbstractModule.prototype.start = function() {
};


/**
 * Returns outgoing {@link Datapoint.Datapoint Datapoint} for given name
 *
 * @param {String} name
 * @returns {Datapoint.Datapoint}
 */
AbstractModule.prototype.getOutput = function(name) {
    return this._outputs[name];
};

/**
 * Returns ingoing {@link Datapoint.Datapoint Datapoint} for given name
 *
 * @param {String} name
 * @returns {Datapoint.Datapoint}
 */
AbstractModule.prototype.getInput = function(name) {
    return this._inputs[name];
};

module.exports = AbstractModule;