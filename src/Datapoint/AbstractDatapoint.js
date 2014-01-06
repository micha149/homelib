function AbstractDatapoint(options) {
    if (this.constructor === arguments.callee) {
        throw new Error('An AbstractDatapoint can not be instanciated directly');
    }

    this._id = options.id;
    this._name = options.name;
}

AbstractDatapoint.prototype.getId = function() {
    return this._id;
};

AbstractDatapoint.prototype.getType = function() {
    return this._type;
};

AbstractDatapoint.prototype.getName = function() {
    return this._name;
};

module.exports = AbstractDatapoint;