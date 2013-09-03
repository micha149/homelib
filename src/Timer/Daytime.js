function Daytime(str) {
    var matches = str.match(/^(\d{2})\:(\d{2})\:(\d{2})$/);

    if (!matches) {
        throw new Error('Unexpected time format. Expected something like "00:00:00"');
    }

    this.hours   = matches[1];
    this.minutes = matches[2];
    this.seconds = matches[3];
}


Daytime.prototype.getNextDate = function() {

    var now = new Date();

    if (now.getHours() >= this.hours && now.getMinutes() >= this.minutes && now.getSeconds() >= this.seconds) {
        now.setTime(now.getTime() + 86400000);
    }

    now.setHours(this.hours);
    now.setMinutes(this.minutes);
    now.setSeconds(this.seconds);

    return now;
};

module.exports = Daytime;