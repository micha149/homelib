var Daytime = require('./Daytime'),
    Duration = require('./Duration'),
    UnexpectedValueError = require('../Error/UnexpectedValueError');

/**
 * A #RandomOffset instance wraps another #Time object and randomizes the returned time by the given parameters. This is
 * usually used to open blends not at an exactly time for each day.
 *
 *    down = new RandomTimeOffset({
 *        time: new DayTime("18:00:00"),
 *        min: "-30m",
 *        max: "+45m"
 *    });
 *
 * @param {Timer.Time|object} time
 * @param {Timer.Time} time.time
 * @param {Timer.Duration} time.min
 * @param {Timer.Duration} time.max
 * @class Timer.RandomOffset
 */
function RandomOffset(time) {

    var min = -9000,
        max = 9000;

    if (!(time instanceof Daytime)) {
        min = time.min || min;
        max = time.max || max;
        time = time.time;
    }

    if (!(time instanceof Daytime)) {
        throw new UnexpectedValueError('Expected time object instance');
    }

    this._time = time;
    this.setMin(min);
    this.setMax(max);
}

/**
 * Sets the minimum time offset
 *
 * @param {Timer.Duration} dur
 * @returns this
 * @chainable
 */
RandomOffset.prototype.setMin = function (dur) {
    if (!(dur instanceof Duration)) {
        dur = new Duration(dur);
    }
    this._min = dur;
    return this;
}

/**
 * Sets the maximum time offset
 *
 * @param dur
 * @returns this
 * @chainable
 */
RandomOffset.prototype.setMax = function (dur) {
    if (!(dur instanceof Duration)) {
        dur = new Duration(dur);
    }
    this._max = dur;
    return this;
}

/**
 * Returns a new randomized date object based on previously given #Time object and configured min and max values.
 *
 * @returns {Date}
 */
RandomOffset.prototype.getNextDate = function() {
    var date = this._time.getNextDate(),
        min  = this._min,
        max  = this._max,
        rand = ((max - min) * Math.random()) + min;

    return new Date(date.getTime() + rand);
};

module.exports = RandomOffset;