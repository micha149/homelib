process.env.TZ = 'Europe/Berlin';

var Daytime = require('../../homelib').Timer.Daytime,
    assert  = require('assert'),
    sinon   = require('sinon');

describe('Timer.Daytime', function() {

    describe('constructor', function() {

        it('parses constructor string parameter', function() {
            var daytime = new Daytime('18:44:17');

            assert.equal(daytime.hours, 18, "Hour parsed correctly");
            assert.equal(daytime.minutes, 44, "Minute parsed correctly");
            assert.equal(daytime.seconds, 17, "Second parsed correctly");
        });

        it('throw exception if time format is not `00:00:00`', function() {
            var daytime;

            assert.throws(function() {
                daytime = new Daytime('18:44');
            });

            assert.throws(function() {
                daytime = new Daytime('18:44:12:22');
            });

            assert.throws(function() {
                daytime = new Daytime('18:44::');
            });

            assert.throws(function() {
                daytime = new Daytime('18:44:xx');
            });
        });
    });

    describe('getNextDate', function() {

        var clock;

        beforeEach(function() {
            clock = sinon.useFakeTimers(new Date("Sun May 05 2013 16:55:00 GMT+0200 (CEST)").getTime());
        });

        afterEach(function() {
            clock.restore();
        });

        it('returns correct time of following day if time is smaller current time', function() {

            var next,
                daytime = new Daytime('14:00:00');

            next = daytime.getNextDate();

            assert.deepEqual(next, new Date("Mon May 06 2013 14:00:00 GMT+0200 (CEST)"));
        });

        it('returns correct time of same day if time is greater current time', function() {

            var next,
                daytime = new Daytime('18:30:27');

            next = daytime.getNextDate();

            assert.deepEqual(next, new Date("Sun May 05 2013 18:30:27 GMT+0200 (CEST)"));
        });

        it('returns correct time of next day if time is equal current time', function() {

            var next,
                daytime = new Daytime('16:55:00');

            next = daytime.getNextDate();

            assert.deepEqual(next, new Date("Mon May 06 2013 16:55:00 GMT+0200 (CEST)"));
        });
    });

});