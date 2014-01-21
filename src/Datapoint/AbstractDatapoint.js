function AbstractType(options) {
    if (this.constructor === AbstractType) {
        throw new Error('An AbstractType can not be instantiated directly');
    }

    this._id = options.id;
    this._name = options.name;
}

AbstractType.prototype.getId = function() {
    return this._id;
};

AbstractType.prototype.getType = function() {
    return this._type;
};

AbstractType.prototype.getName = function() {
    return this._name;
};

module.exports = AbstractType;