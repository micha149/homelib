var util = require('util'),
    events = require('events');

/**
 * Interface object for driver instances. Should be used with #assert.implements
 * to check if an objects implements all required methods.
 *
 * @class Driver.DriverInterface
 * @extends events.EventEmitter
 * @constructor
 */
function DriverInterface() {}

util.inherits(DriverInterface, events.EventEmitter);

/**
 * Fires a message event if a request from the bus was received
 *
 * @event message
 * @param {Message} message Message object
 */

/**
 * Fired if the driver has connected to the remote interface
 *
 * @event connected
 */

/**
 * Opens a connection to the remote interface. The given callback will
 * be executed after a connection has been established.
 *
 * @param {Function} callback
 * @fires connected
 */
DriverInterface.prototype.connect = function() {};

/**
 * Closes the connection to the remote interface
 */
DriverInterface.prototype.disconnect = function() {};

/**
 * Returns true if the driver is connected to the remote
 * @returns {Boolean}
 */
DriverInterface.prototype.isConnected = function() {};

/**
 * Sends a message to the bus
 * @param {Message} msg
 */
DriverInterface.prototype.send = function(msg) {};

module.exports = DriverInterface;