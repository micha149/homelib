var definitionsByName = {},
    definitionsById = {},
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    _ = require('underscore');

_.map(require('./_definitions.json'), function(definition) {
    definitionsByName[definition.name] = definition;
    definitionsById[definition.id] = definition;
});

module.exports = function DatapointFactory() {
    this._instances = {};
};

var DatapointFactory = module.exports;

DatapointFactory.prototype.get = function(id) {
    var def = definitionsById[id] || definitionsByName[id],
        constructor;

    if (!def) {
        throw new UnexpectedValueError('Definition not found');
    }

    if (!this._instances[def.id]) {
        constructor = this._getConstructor(def.type);
        this._instances[def.id] = new constructor(def);
    }

    return this._instances[def.id];
};

DatapointFactory.prototype._getConstructor = function(type) {
    switch(type) {
        case "PDT_BINARY_INFORMATION":
            return require('./BinaryDatapoint');
    }
};