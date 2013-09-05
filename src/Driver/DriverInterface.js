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

DriverInterface.prototype.connect = function(options) {};

DriverInterface.prototype.isConnected = function() {};

DriverInterface.prototype.send = function(msg) {};

module.exports = DriverInterface;