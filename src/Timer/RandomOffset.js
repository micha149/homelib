var Daytime = require('./Daytime'),
    Duration = require('./Duration'),
    UnexpectedValueError = require('../Error/UnexpectedValueError');

function RandomOffset(time) {

    if (!(time instanceof Daytime)) {
        throw new UnexpectedValueError('Expected time object instance');
    }

    this.time = time;
    this.min  = new Duration(-9000);
    this.max  = new Duration(9000);
}

RandomOffset.prototype.setMin = function (dur) {
    if (!(dur instanceof Duration)) {
        dur = new Duration(dur);
    }
    this.min = dur;
}

RandomOffset.prototype.setMax = function (dur) {
    if (!(dur instanceof Duration)) {
        dur = new Duration(dur);
    }
    this.max = dur;
}

RandomOffset.prototype.getNextDate = function() {
    var date = this.time.getNextDate(),
        min  = this.min,
        max  = this.max,
        rand = ((max - min) * Math.random()) + min;

    return new Date(date.getTime() + rand);
};

module.exports = RandomOffset;