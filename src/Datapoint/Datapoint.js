var _ = require('underscore'),
    AbstractType = require('./AbstractType'),
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    TypeFactory = require('./TypeFactory');

/**
 * A Datapoint represents an data interface and can be used as input or output
 * of any object which works with data types. It implements the
 * publisher/subscriber pattern.
 *
 * If a type is given to the Datapoint it will be used to validate the opposite
 * datapoint when subscribe is called. If both datapoints have types and they
 * didn't match, an exception will be thrown.
 *
 * For example:
 * We have a date module which provides the next upcoming sun rise and a blends
 * module which needs a date/time for opening the blends. So, we take the input
 * datapoint of our blends module and subscribe its publish method with the
 * output datapoint of out date module. Internally the modules uses the datapoint
 * methods publish() and subscribe() for setting and receiving the data, too.
 *
 *     var output = dateModule.getOutput("date"),
 *         input = blendsModule.getInput("uptime");
 *
 *     output.subscribe(input);
 *
 * @class Datapoint.Datapoint
 * @param type {Datapoint.AbstractType}
 * @constructor
 */
function Datapoint(type) {
    this._type = type;
    this._subscribers = [];
    this._value;
}

/**
 * Returns type for this datapoint
 *
 * @returns {Datapoint.AbstractType}
 */
Datapoint.prototype.getType = function() {
    return this._type;
};

/**
 * Returns true if the Datapoint instance has a type
 *
 * @returns {boolean}
 */
Datapoint.prototype.hasType = function() {
    return !!this._type;
};

/**
 * Checkf if type of given datapoint matches to type tyupe of these instance.
 * An #Error.UnexpectedValueError will be thrown if types didn't match.
 *
 * @param {Datapoint.Datapoint} datapoint
 * @private
 */
Datapoint.prototype._assertDatapointType = function(datapoint) {
    if (datapoint.hasType() && this.hasType() && datapoint.getType() !== this.getType()) {
        throw new UnexpectedValueError('Type of given datapoint did not match');
    }
};

/**
 * If its necessary to wrap the the given callback with a bind, this
 * mehtod will do this. The original callback is also stored in a
 * property of the wrapperfunction for unsubcribing.
 *
 * @param {Function} callback
 * @returns {Function}
 * @private
 */
Datapoint.prototype._getCallbackforDatapoint = function (callback) {

    if (!(callback instanceof Datapoint)) {
        return callback;
    }

    var wrapper = callback.publish.bind(callback);

    this._assertDatapointType(callback);
    wrapper.wrappedFunction = callback;

    return wrapper;
};

/**
 * Subscribes a callback on this datapoint. The callback will be triggered each
 * time the value changes using #publish. If #publish was called before
 * {@link #subscribe}, the callback is triggered immediately.
 *
 * If a #Datapoint.Datapoint is given as subscriber, it publish method is called each time
 * a value gets published. This could be used for connections between Modules.
 *
 *     datapoint.subscribe(function(value) {
 *         // executed each time a new value is published
 *     });
 *
 *     datapoint.subscribe(anotherDatapoint);
 *
 * @param {Function|Datapoint.Datapoint} callback Callback function or Datapoint
 */
Datapoint.prototype.subscribe = function(callback) {

    callback = this._getCallbackforDatapoint(callback);

    this._subscribers.push(callback);

    if (this._value) {
        callback(this._value);
    }
};

/**
 * Same functionality like #subscribe(), but the callback will be unsubscribed
 * automatically after first call.
 *
 *     datapoint.subscribeOnce(function(value) {
 *         // executed once a new value is published
 *     });
 *
 * @param {Function|Datapoint.Datapoint} callback Callback function or Datapoint
 */
Datapoint.prototype.subscribeOnce = function(callback) {
    var self = this,
        wrapper;

    callback = this._getCallbackforDatapoint(callback);

    if (this._value) {
        callback(this._value);
    } else {
        wrapper = function() {
            callback(self._value);
            self._subscribers = _.without(self._subscribers, wrapper);
        };
        wrapper.wrappedFunction = callback;
        this._subscribers.push(wrapper);
    }
};

/**
 * Removes the given callback from the subscribers
 *
 * @param {Function} callback
 */
Datapoint.prototype.unsubscribe = function(callback) {
    this._subscribers = _.reject(this._subscribers, function(subscriber) {
        return subscriber === callback ||
            subscriber.wrappedFunction === callback;
    });
};

/**
 * Publishes the given value and stores it for new subscribers.
 *
 * @param {Mixed} value
 */
Datapoint.prototype.publish = function(value) {
    var self = this;

    this._value = value;

    _.each(this._subscribers, function(subscriber) {
        subscriber(value);
    });
};

/**
 * Creates a datapoint with the given type id
 *
 * @param {string} typeId
 * @returns {Datapoint.Datapoint}
 * @static
 */
Datapoint.create = function(typeId) {
    var type = typeId ? TypeFactory.create(typeId) : undefined;
    return new Datapoint(type);
};

module.exports = Datapoint;