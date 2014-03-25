var _ = require("underscore"),
    Datapoint = require("../Datapoint/Datapoint"),
    UnexpectedValueError = require('../Error/UnexpectedValueError');


function BlendsTimerModule(str) {

    this._outputs = {
        'updown': Datapoint.create("1.008")
    };

    this._inputs = {
        'uptime': Datapoint.create("10.001"),
        'downtime': Datapoint.create("10.001")
    };

    this._timeouts = {
        up: null,
        down: null
    };

    this._nextTime = {
        up: null,
        down: null
    };
}

BlendsTimerModule.prototype.start = function() {
    var self = this,
        uptime = this._inputs.uptime,
        downtime = this._inputs.downtime;

    uptime.subscribe(function(uptime) {
        self._nextTime.up = uptime;
        if (!self._timeouts.up) {
            self._startTimer.call(self, 'up', uptime);
        }
    });

    downtime.subscribe(function(downtime) {
        self._nextTime.down = downtime;
        if (!self._timeouts.down) {
            self._startTimer.call(self, 'down', downtime);
        }
    });

};

BlendsTimerModule.prototype._startTimer = function(dir, time) {
    var self = this,
        diff = self._getSecondsUntil(time),
        nextTime = this._nextTime,
        timeouts = this._timeouts,
        output = this._outputs.updown;

    clearTimeout(self._timeouts[dir]);

    timeouts[dir] = setTimeout(function() {
        timeouts[dir] = null;
        output.publish(dir);
        if (nextTime[dir] > Date.now()) {
            self._startTimer(dir, nextTime[dir]);
        }
    }, diff);
};

BlendsTimerModule.prototype._getSecondsUntil = function (date) {
    var diff = date.getTime() - Date.now();
    return diff;
};

/**
 * Returns outgoing {@link Datapoint.Datapoint Datapoint} for given name
 *
 * @param {String} name
 * @returns {Datapoint.Datapoint}
 */
BlendsTimerModule.prototype.getOutput = function(name) {
    return this._outputs[name];
};

/**
 * Returns ingoing {@link Datapoint.Datapoint Datapoint} for given name
 *
 * @param {String} name
 * @returns {Datapoint.Datapoint}
 */
BlendsTimerModule.prototype.getInput = function(name) {
    return this._inputs[name];
};

module.exports = BlendsTimerModule;