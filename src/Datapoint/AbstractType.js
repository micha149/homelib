/**
 * @class Datapoint.AbstractType
 * @param {Object} options Hash with type options
 * @param {String} options.id Datapoint type ID like "1.001"
 * @param {String} options.name Readable name for datapoint type
 * @constructor
 */
function AbstractType(options) {
    if (this.constructor === AbstractType) {
        throw new Error('An AbstractType can not be instantiated directly');
    }

    /**
     * Types id
     * @type {String}
     * @private
     */
    this._id = options.id;

    /**
     * Types name
     * @type {String}
     * @private
     */
    this._name = options.name;

    /**
     * Types type identifier
     * @property {String} _type
     * @private
     * @static
     */
}

/**
 * Returns id of datapoint type
 *
 * @returns {String}
 */
AbstractType.prototype.getId = function() {
    return this._id;
};

/**
 * Returns type identifier of datapoint type
 * @returns {String}
 */
AbstractType.prototype.getType = function() {
    return this._type;
};

/**
 * Returns name of datapoint type
 * @returns {String}
 */
AbstractType.prototype.getName = function() {
    return this._name;
};

module.exports = AbstractType;