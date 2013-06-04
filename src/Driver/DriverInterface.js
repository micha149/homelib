var util = require('util'),
    events = require('events');

function DriverInterface() {}

util.inherits(DriverInterface, events.EventEmitter);

DriverInterface.prototype.connect = function(options) {}

DriverInterface.prototype.isConnected = function() {}

DriverInterface.prototype.send = function(msg) {}

module.exports = DriverInterface;