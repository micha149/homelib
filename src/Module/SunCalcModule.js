var _ = require("underscore"),
    util = require('util'),
    SunCalc = require('suncalc'),
    Datapoint = require("../Datapoint/Datapoint"),
    AbstractModule = require('./AbstractModule'),
    UnexpectedValueError = require('../Error/UnexpectedValueError');

/**
 * @constructor
 * @class Module.SunCalcModule
 * @param {Number} lat Latitude of current position
 * @param {Number} lng Longtitude of current position
 */
function SunCalcModule(lat, lng) {

    var self = this;

    /**
     * Current latitude
     *
     * @type {Number}
     * @private
     */
    this._lat = lat;

    /**
     * Current longtitude
     *
     * @type {Number}
     * @private
     */
    this._lng = lng;

    this._outputs = {};

    _.each(this._timeNames, function(name) {
        self._outputs[name] = Datapoint.create("10.001");
    });

    this._inputs = {
    };

    AbstractModule.apply(this, arguments);
}
util.inherits(SunCalcModule, AbstractModule);

SunCalcModule.prototype._timeNames = [
    'solarNoon', 'nadir',
    'sunrise', 'sunset',
    'sunriseEnd', 'sunsetStart',
    'dawn', 'dusk',
    'nauticalDawn', 'nauticalDusk',
    'nightEnd', 'night',
    'goldenHourEnd', 'goldenHour'
];

SunCalcModule.prototype.start = function() {
    var self = this;

    this._updateTimes();

    _.each(this._timeNames, function(name) {
        self._publishTime(name);
    });

};

SunCalcModule.prototype._updateTimes = function() {

    var midnight = new Date();

    midnight.setHours(0);
    midnight.setMinutes(0);
    midnight.setSeconds(0);
    midnight.setDate(midnight.getDate() + 1);

    this.today = this._getTimes();
    this.tomorrow = this._getTimes(1);

    setTimeout(this._updateTimes.bind(this), midnight.getTime() - Date.now());
};

SunCalcModule.prototype._publishTime = function(name) {

    var self = this,
        time = this.today[name],
        timeDiff;

    if (this.today[name] <= Date.now()) {
        time = this.tomorrow[name];
    }

    timeDiff = time.getTime() - Date.now();

    if(timeDiff <= 0) {
        throw new UnexpectedValueError("Unexpected date is not in future: " + time);
    }

    setTimeout(function() {
        self._publishTime(name);
    }, timeDiff);

    this._outputs[name].publish(time);
};

/**
 * Returns times for today. If a numeric offset is given, it will be
 * added to current date.
 *
 * @param {Number} offset
 * @return {Object}
 * @private
 */
SunCalcModule.prototype._getTimes = function(offset) {
    var now = new Date();
    now.setHours(12);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setDate(now.getDate() + (offset || 0));

    return SunCalc.getTimes(now, this._lat, this._lng);
};

module.exports = SunCalcModule;