var Driver = require('./Driver/DriverInterface'),
    Message = require('./Message'),
    invoke = require('underscore').invoke,
    assert = require('./assert');

/**
 * The connection object represents an interface to the knx
 * bus. It needs a specific driver instance for the used
 * medium like KnxIP.
 *
 * @class Connection
 * @param {Driver.DriverInterface} driver
 * @constructor
 */
function Connection(driver) {

    var self = this;

    assert.implements(driver, Driver);

    this._driver = driver;
    this._listeners = {};
    this._readRequests = {};

    driver.on('message', function(message) {
        switch(message.getCommand()) {
            case "read":
                self._onReadMessage(message);
                break;
            case "write":
                self._onWriteMessage(message);
                break;
            case "answer":
                self._onAnswerMessage(message);
                break;
        }
    });
}

/**
 * Called when driver emits a message. This callback will trigger
 * listeners for the destination address of the given message.
 *
 * @param {Message} message
 * @private
 */
Connection.prototype._onWriteMessage = function(message) {

    var rawAddress = message.getDestination().getRaw(),
        callbacks  = this._listeners[rawAddress];

    if (callbacks) {
        invoke(callbacks, "call", this, message);
    }
};

/**
 * Triggered when driver receives a read message. Currently I can't
 * figure out any pattern to handle a read situation.
 *
 * @param {Message} message
 * @private
 */
Connection.prototype._onReadMessage = function(message) {

};

/**
 * Called when an answer message is received. It goes through read list
 * an looks for any matching read request. Callbacks of matching reads are
 * fired and requests are deleted.
 *
 * @param {Message} message
 * @private
 */
Connection.prototype._onAnswerMessage = function(message) {
    var callbacks = this._readRequests[message.getDestination()];

    if (callbacks) {
        invoke(callbacks, "call", this, message);
    }
};

/**
 * Sends a message to the bus. This method creates first a connection
 * if the driver is currently not connected. After a connection was
 * established, the message will be send.
 *
 * The given callback will be executed after the message was send successfully
 *
 * @param {Message} msg
 * @param {Function} callback
 */
Connection.prototype.send = function(msg, callback) {
    var driver = this._driver;
    if (!driver.isConnected()) {
        driver.connect(function() {
            driver.send(msg, callback);
        });
        return;
    }

    driver.send(msg, callback);
};

/**
 * Adds a listener for messages with the given destination address.
 *
 * @param {GroupAddress} address
 * @param {Function} callback
 */
Connection.prototype.on = function (address, callback) {
    var driver     = this._driver,
        listeners  = this._listeners,
        rawAddress = address.getRaw();

    if (!driver.isConnected()) {
        driver.connect();
    }

    listeners[rawAddress] = listeners[rawAddress] || [];
    listeners[rawAddress].push(callback);
};

Connection.prototype.read = function(address, callback) {
    var driver = this._driver,
        msg = new Message();

    msg.setCommand('read');
    msg.setDestination(address);

    if (this._readRequests[address]) {
        this._readRequests[address].push(callback);
        return;
    }

    this._readRequests[address] = [callback];
    this.send(msg);
};

Connection.prototype.disconnect = function() {
    var driver = this._driver;
    if (driver.isConnected()) {
        driver.disconnect();
    }
};

module.exports = Connection;