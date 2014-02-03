var Driver = require('./Driver/DriverInterface'),
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

    assert.implements(driver, Driver);

    this._driver = driver;
    this._listeners = {};

    driver.on('message', this._onDriverMessage.bind(this));
    process.on('exit', this._onProcessExit.bind(this));
}

/**
 * Called when driver emits a message. This callback will trigger
 * listeners for the destination address of the given message.
 *
 * @param {Message} message
 * @private
 */
Connection.prototype._onDriverMessage = function(message) {

    var rawAddress = message.getDestination().getRaw(),
        callbacks  = this._listeners[rawAddress];

    if (callbacks) {
        invoke(callbacks, "call", this, message);
    }
};

/**
 * This callback is triggered when the node process gets terminated.
 * It calls disconnect() on driver if driver is currently connected to
 * avoid dead connection on connected remotes
 *
 * @private
 */
Connection.prototype._onProcessExit = function() {
    if(this._driver.isConnected()) {
        this._driver.disconnect();
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

Connection.prototype.disconnect = function() {
    var driver = this._driver;
    if (driver.isConnected()) {
        driver.disconnect();
    }
};

module.exports = Connection;