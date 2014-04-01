var _ = require("underscore"),
    util = require('util'),
    Datapoint = require("../Datapoint/Datapoint"),
    AbstractModule = require('./AbstractModule'),
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

    AbstractModule.apply(this, arguments);
}
util.inherits(BlendsTimerModule, AbstractModule);

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

module.exports = BlendsTimerModule;