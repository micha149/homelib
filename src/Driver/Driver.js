var util = require('util'),
    events = require('events');

function Driver() {
    events.EventEmitter.call(this);
    this._connected = false;
}

util.inherits(Driver, events.EventEmitter);

Driver.prototype.connect = function(options) {

}

Driver.prototype.isConnected = function() {
    return this._connected;
}

Driver.prototype.send = function(msg) {

}

module.exports = Driver;