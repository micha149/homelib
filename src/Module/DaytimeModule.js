var _ = require("underscore"),
    Datapoint = require("../Datapoint/Datapoint"),
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

    this.hours   = matches[1];
    this.minutes = matches[2];
    this.seconds = matches[3];

    this._outputs = {
        'date': Datapoint.create("10.001")
    };

    this._inputs = {
        'trigger': Datapoint.create("1.017")
    };
}

DaytimeModule.prototype.start = function() {
    var nextDate = this._getNextDate();

    this._outputs.date.publish(nextDate);
    setTimeout(this.start.bind(this), nextDate.getTime() - Date.now());
};

DaytimeModule.prototype._getNextDate = function() {

    var now = new Date();

    if (now.getHours() >= this.hours && now.getMinutes() >= this.minutes && now.getSeconds() >= this.seconds) {
        now.setTime(now.getTime() + 86400000);
    }

    now.setHours(this.hours);
    now.setMinutes(this.minutes);
    now.setSeconds(this.seconds);

    return now;
};

/**
 * Returns outgoing {@link Datapoint.Datapoint Datapoint} for given name
 *
 * @param {String} name
 * @returns {Datapoint.Datapoint}
 */
DaytimeModule.prototype.getOutput = function(name) {
    return this._outputs[name];
};

/**
 * Returns ingoing {@link Datapoint.Datapoint Datapoint} for given name
 *
 * @param {String} name
 * @returns {Datapoint.Datapoint}
 */
DaytimeModule.prototype.getInput = function(name) {
    return this._inputs[name];
};

module.exports = DaytimeModule;