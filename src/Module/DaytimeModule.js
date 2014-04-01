var _ = require("underscore"),
    util = require('util'),
    Datapoint = require("../Datapoint/Datapoint"),
    AbstractModule = require('./AbstractModule'),
    UnexpectedValueError = require('../Error/UnexpectedValueError');

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
 * @param {String} Time string like `18:45:00`
 */
function DaytimeModule(str) {
    var matches = str.match(/^(\d{2})\:(\d{2})\:(\d{2})$/);

    if (!matches) {
        throw new UnexpectedValueError('Unexpected time format. Expected something like "00:00:00"');
    }

    this.hours   = Number(matches[1]);
    this.minutes = Number(matches[2]);
    this.seconds = Number(matches[3]);

    this._outputs = {
        'date': Datapoint.create("10.001")
    };

    this._inputs = {
        'trigger': Datapoint.create("1.017")
    };

    AbstractModule.apply(this, arguments);
}
util.inherits(DaytimeModule, AbstractModule);

DaytimeModule.prototype.start = function() {
    var nextDate = this._getNextDate();

    this._outputs.date.publish(nextDate);
    setTimeout(this.start.bind(this), nextDate.getTime() - Date.now());
};

DaytimeModule.prototype._getNextDate = function() {

    var now = new Date(),
        currentSeconds = getSeconds(now.getHours(), now.getMinutes(), now.getSeconds()),
        expectedSeconds = getSeconds(this.hours, this.minutes, this.seconds);

    function getSeconds(hours, minutes, seconds) {
        return Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
    }

    if (currentSeconds >= expectedSeconds) {
        now.setTime(now.getTime() + 86400000);
    }

    now.setHours(this.hours);
    now.setMinutes(this.minutes);
    now.setSeconds(this.seconds);

    return now;
};

module.exports = DaytimeModule;