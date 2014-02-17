var definitionsByName = {},
    definitionsById = {},
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    _ = require('underscore'),
    globalFactoryInstance;

_.map(require('./_definitions.json'), function(definition) {
    definitionsByName[definition.name] = definition;
    definitionsById[definition.id] = definition;
});

function TypeFactory() {
    this._instances = {};
}

TypeFactory.prototype.get = function(id) {
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

TypeFactory.prototype._getConstructor = function(type) {
    switch(type) {
        case "PDT_BINARY_INFORMATION":
            return require('./BinaryType');
        case "PDT_TIME":
            return require('./TimeType');
        case "1ByteRangeType":
            return require('./RangeType');
    }
};

TypeFactory.create = function(id) {
    if (!globalFactoryInstance) {
        globalFactoryInstance = new TypeFactory();
    }
    return globalFactoryInstance.get(id);
};

module.exports = TypeFactory;