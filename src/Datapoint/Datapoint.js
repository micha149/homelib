var _ = require('underscore'),
    AbstractType = require('./AbstractType'),
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    TypeFactory = require('./TypeFactory');

/**
 * A Datapoint represents an data interface and can be used as input or output
 * of any object which works with data types. It implements the
 * publisher/subscriber pattern.
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
 *     // Only needed for generic configuration interfaces
 *     if (output.getType() !== input.getType()) {
 *         throw new Error('Output must consist of same type as input');
 *     }
 *
 *     output.subscribe(input.publish);
 *
 * @class Datapoint.Datapoint
 * @param type {Datapoint.AbstractType}
 * @constructor
 */
function Datapoint(type) {

    if (!type || !(type instanceof AbstractType)) {
        throw new UnexpectedValueError('Expected DatapointType as first argument of Datapoint');
    }

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
 * Subscribes a callback on this datapoint. The callback will be triggered each
 * time the value changes using #publish. If #publish was called before
 * {@link #subscribe}, the callback is triggered immediately.
 *
 *     datapoint.subscribe(function(value) {
 *         // executed each time a new value is published
 *     });
 *
 * @param {Function} callback
 */
Datapoint.prototype.subscribe = function(callback) {
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
 * @param {Function} callback
 */
Datapoint.prototype.subscribeOnce = function(callback) {
    var self = this,
        wrapper;

    if (this._value) {
        callback.call(this, this._value);
    } else {
        wrapper = function() {
            callback.call(self, self._value);
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
 * @returns {Datapoint}
 * @static
 */
Datapoint.create = function(typeId) {
    var type = TypeFactory.create(typeId);

    return new Datapoint(type);
};

module.exports = Datapoint;