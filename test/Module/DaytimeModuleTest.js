var sinon = require('sinon'),
    expect = require('chai').expect,
    homelib = require('../../homelib'),
    DaytimeModule = homelib.Module.DaytimeModule,
    Datapoint = homelib.Datapoint.Datapoint,
    UnexpectedValueError = homelib.Error.UnexpectedValueError;

describe('Module.DaytimeModule', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();

        sandbox.stub(Datapoint, "create", function() {
            return sinon.createStubInstance(Datapoint);
        });

        this.clock = sinon.useFakeTimers();

        this.setFakeTime = function(str) {
            var unixtime = new Date(str).getTime();
            this.clock.restore();
            this.clock = sinon.useFakeTimers(unixtime);
            return this.clock;
        };
    });

    afterEach(function() {
        sandbox.restore();
        this.clock.restore();
    });

    describe('creating an instance', function() {

        it('calls Datapoint factory to create output and input', function() {
            var daytime = new DaytimeModule('18:00:00');

            expect(Datapoint.create).to.be.calledTwice;
            expect(daytime.getOutput('date')).to.be.instanceOf(Datapoint);
            expect(daytime.getInput('trigger')).to.be.instanceOf(Datapoint);
        });

        it('does not call outputs publish method', function() {
            var daytime = new DaytimeModule('18:00:00');
            expect(daytime.getOutput('date').publish).not.to.be.called;
        });

        it('throw exception if time format is not `00:00:00`', function() {
            var daytime;

            expect(function() {
                daytime = new DaytimeModule('18:44');
            }).to.throw(UnexpectedValueError);

            expect(function() {
                daytime = new DaytimeModule('18:44:12:22');
            }).to.throw(UnexpectedValueError);

            expect(function() {
                daytime = new DaytimeModule('18:44::');
            }).to.throw(UnexpectedValueError);

            expect(function() {
                daytime = new DaytimeModule('18:44:xx');
            }).to.throw(UnexpectedValueError);
        });

    });

    describe('starting module', function() {

        it('publishes correct time to output', function() {
            var expectedDate = new Date('2014-09-14 18:00:00'),
                daytime = new DaytimeModule('18:00:00');

            this.setFakeTime('2014-09-14 10:00:00');
            daytime.start();

            expect(daytime.getOutput('date').publish).to.be.calledWith(expectedDate);
        });

        it('publishes correct time of following day if time is smaller current time', function() {
            var expectedDate = new Date("Mon May 06 2013 14:00:00 GMT+0200 (CEST)"),
                daytime = new DaytimeModule('14:00:00');

            this.setFakeTime("Sun May 05 2013 16:55:00 GMT+0200 (CEST)");
            daytime.start();

            expect(daytime.getOutput('date').publish).to.be.calledWith(expectedDate);
        });

        it('returns correct time of same day if time is greater current time', function() {
            var expectedDate = new Date("Sun May 05 2013 18:30:27 GMT+0200 (CEST)"),
                daytime = new DaytimeModule('18:30:27');

            this.setFakeTime("Sun May 05 2013 16:55:00 GMT+0200 (CEST)");
            daytime.start();

            expect(daytime.getOutput('date').publish).to.be.calledWith(expectedDate);
        });

        it('returns correct time of next day if time is equal current time', function() {
            var expectedDate = new Date("Mon May 06 2013 16:55:00 GMT+0200 (CEST)"),
                daytime = new DaytimeModule('16:55:00');

            this.setFakeTime("Sun May 05 2013 16:55:00 GMT+0200 (CEST)");
            daytime.start();

            expect(daytime.getOutput('date').publish).to.be.calledWith(expectedDate);
        });

        it('publishes next time, if current time has been expired', function() {
            var expectedDate = new Date('2014-02-14 08:15:00'),
                daytime = new DaytimeModule('08:15:00'),
                clock;

            clock = this.setFakeTime('2014-02-13 07:00:00');

            daytime.start();
            expect(daytime.getOutput('date').publish).to.be.calledOnce;

            clock.tick(4500000 - 1); // 1:15:00 - 1 second
            expect(daytime.getOutput('date').publish).to.be.calledOnce;

            clock.tick(1);
            expect(daytime.getOutput('date').publish).to.be.calledTwice;
            expect(daytime.getOutput('date').publish).to.be.calledWith(expectedDate);
        });
    });

});