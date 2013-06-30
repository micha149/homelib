/**
 * To access the EventEmitter class, `require('events').EventEmitter`.
 *
 * When an EventEmitter instance experiences an error, the typical action
 * is to emit an `error` event. Error events are treated as a special case
 * in node. If there is no listener for it, then the default action is to print
 * a stack trace and exit the program.
 *
 * All EventEmitters emit the event `newListener` when new listeners are added
 * and `removeListener` when a listener is removed.
 *
 * @class events.EventEmitter
 */

/**
 * Adds a listener to the end of the listeners array for the specified event.
 *
 *     server.on('connection', function (stream) {
 *         console.log('someone connected!');
 *     });
 *
 * Returns emitter, so calls can be chained.
 *
 * @method addListener
 * @param {String} event Event name
 * @param {Function} callback Callback function
 * @chainable
 */

/**
 * @method on
 * @inheritdoc events.EventEmitter#addListener
 */

/**
 * Adds a one time listener for the event. This listener is invoked only the next
 * time the event is fired, after which it is removed.
 *
 *     server.once('connection', function (stream) {
 *         console.log('Ah, we have our first user!');
 *     });
 *
 * Returns emitter, so calls can be chained.
 *
 * @method once
 * @param {String} event Event name
 * @param {Function} callback Callback function
 * @chainable
 */

/**
 * Remove a listener from the listener array for the specified event.
 * Caution: changes array indices in the listener array behind the listener.
 *
 *     var callback = function(stream) {
 *         console.log('someone connected!');
 *     };
 *     server.on('connection', callback);
 *     // ...
 *     server.removeListener('connection', callback);
 *
 * Returns emitter, so calls can be chained.
 *
 * @method removeListener
 * @param {String} event Event name
 * @param {Function} callback Callback function
 * @chainable
 */

/**
 * Removes all listeners, or those of the specified event.
 *
 * Returns emitter, so calls can be chained.
 *
 * @method removeAllListeners
 * @param {String} [event] Event name
 * @chainable
 */

/**
 * By default EventEmitters will print a warning if more than 10 listeners
 * are added for a particular event. This is a useful default which helps
 * finding memory leaks. Obviously not all Emitters should be limited to 10.
 * This function allows that to be increased. Set to zero for unlimited.
 *
 * @method setMaxListeners
 * @param {Number} n Max count
 * @chainable
 */

/**
 * Returns an array of listeners for the specified event.
 *
 *     server.on('connection', function (stream) {
 *        console.log('someone connected!');
 *     });
 *     console.log(util.inspect(server.listeners('connection'))); // [ [Function] ]
 *
 * @method listeners
 * @param {String} event Event name
 */

/**
 * Execute each of the listeners in order with the supplied arguments.
 *
 * Returns true if event had listeners, false otherwise.
 *
 * @method emit
 * @param {String} event Event name
 * @param {*} [arg1]
 * @param {*} [arg2]
 * @param {*} [arg3]...
 */

/**
 * Return the number of listeners for a given event.
 *
 * @method listenerCount
 * @param {events.EventEmitter} emitter Emitter instance
 * @param {String} event Event name
 * @static
 */

/**
 * This event is emitted any time someone adds a new listener.
 *
 * @event newListener
 * @param {String} event The event name
 * @param {Function} listener The event handler function
 */

/**
 * This event is emitted any time someone removes a listener.
 *
 * @event removeListener
 * @param {String} event The event name
 * @param {Function} listener The event handler function
 */