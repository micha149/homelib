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

    driver.on('message', this._onDriverMessage.bind(this));

    this._driver = driver;
    this._listeners = {};
}

Connection.prototype._onDriverMessage = function (message) {

    var rawAddress = message.getDestination().getRaw(),
        callbacks  = this._listeners[rawAddress];

    if (callbacks) {
        invoke(callbacks, "call", this, message);
    }
};

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

module.exports = Connection;