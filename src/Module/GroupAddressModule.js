var _ = require("underscore"),
    util = require('util'),
    Datapoint = require("../Datapoint/Datapoint"),
    AbstractModule = require('./AbstractModule'),
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
 * @class Module.GroupAddressModule
 * @param {String} address Group address string like `1/2/3`
 * @param {String} type Datapoint type string like `1.001`
 * @param {Connection} connection
 */
function GroupAddressModule(address, type, connection) {

    this._address = GroupAddress.create(address);
    this._connection = connection;

    this._outputs = {
        'value': Datapoint.create(type)
    };

    this._inputs = {
        'value': Datapoint.create(type)
    };

    AbstractModule.apply(this, arguments);
}
util.inherits(GroupAddressModule, AbstractModule);

GroupAddressModule.prototype.start = function() {

    var input = this._inputs.value,
        address = this._address,
        connection = this._connection;

    connection.on(this._address, this._onMessage.bind(this));
    connection.read(this._address, this._onMessage.bind(this));

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

module.exports = GroupAddressModule;