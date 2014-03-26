var _ = require("underscore"),
    Datapoint = require("../Datapoint/Datapoint"),
    UnexpectedValueError = require('../Error/UnexpectedValueError'),
    GroupAddress = require('../GroupAddress.js'),
    Message = require('../Message.js');

/**
 * The daytime module provides a date object containing the next
 * time where the given pattern matches.
 *
 *     var time = new DaytimeModule("18:00:00");
 *
 *     time.getOutput('date').subscribe(function(date) {
 *         console.info("Next date for 18 o'clock:", date);
 *     });
 *
 * @constructor
 * @class Module.DaytimeModule
 * @param {String} address Group address string like `1/2/3`
 * @param {String} type Datapoint type string like `1.001`
 * @param {Connection} connection
 */
function GroupAddressModule(address, type, connection) {

    this._address = GroupAddress.create(address);
    this._connection = connection

    this._outputs = {
        'value': Datapoint.create(type)
    };

    this._inputs = {
        'value': Datapoint.create(type)
    };
}

GroupAddressModule.prototype.start = function() {

    var input = this._inputs.value,
        address = this._address,
        connection = this._connection;

    connection.on(this._address, this._onMessage.bind(this));

    this._inputs.value.subscribe(function(value) {
        var msg = new Message(),
            data = input.getType().parse(value);

        msg.setDestination(address);
        msg.setData(data);

        connection.send(msg);
    });
};

GroupAddressModule.prototype._onMessage = function(message) {
    var output = this._outputs.value,
        type = output.getType();

    output.publish(type.transform(message.getData()));
};

/**
 * Returns outgoing {@link Datapoint.Datapoint Datapoint} for given name
 *
 * @param {String} name
 * @returns {Datapoint.Datapoint}
 */
GroupAddressModule.prototype.getOutput = function(name) {
    return this._outputs[name];
};

/**
 * Returns ingoing {@link Datapoint.Datapoint Datapoint} for given name
 *
 * @param {String} name
 * @returns {Datapoint.Datapoint}
 */
GroupAddressModule.prototype.getInput = function(name) {
    return this._inputs[name];
};

module.exports = GroupAddressModule;