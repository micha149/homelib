var sinon = require('sinon'),
    expect = require('chai').expect,
    homelib = require('../../homelib'),
    SunCalc = require("suncalc"),
    SunCalcModule = homelib.Module.SunCalcModule,
    Datapoint = homelib.Datapoint.Datapoint,
    UnexpectedValueError = homelib.Error.UnexpectedValueError;

describe('Module.SunCalcModule', function() {

    var sandbox,
        timeNames = ['solarNoon', 'nadir', 'sunrise', 'sunset', 'sunriseEnd', 'sunsetStart',
            'dawn', 'dusk', 'nauticalDawn', 'nauticalDusk', 'nightEnd', 'night',
            'goldenHour', 'goldenHourEnd'];

    beforeEach(function() {
        sandbox = sinon.sandbox.create();

        sandbox.stub(Datapoint, "create", function() {
            return sinon.createStubInstance(Datapoint);
        });

        this.clock = sinon.useFakeTimers();

        this.getTimes = sandbox.stub(SunCalc, "getTimes", function(date) {

            function createDate(time) {
                return new Date(date.toDateString() + " " + time);
            }

            return {
                nadir: createDate("01:34:21"),
                nightEnd: createDate("04:53:04"),
                nauticalDawn: createDate("05:38:04"),
                dawn: createDate("06:19:27"),
                sunrise: createDate("06:53:27"),
                sunriseEnd: createDate("06:56:53"),
                goldenHourEnd: createDate("07:37:09"),
                solarNoon: createDate("13:34:21"),
                goldenHour: createDate("19:31:33"),
                sunsetStart: createDate("20:11:49"),
                sunset: createDate("20:15:15"),
                dusk: createDate("20:49:15"),
                nauticalDusk: createDate("21:30:38"),
                night: createDate("22:15:37")
            };
        });

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

        it('calls Datapoint factory to create outputs', function() {
            var module = new SunCalcModule(50.783387, 7.156728);

            expect(Datapoint.create.callCount).to.be.equal(14);

            timeNames.forEach(function(outputName) {
                expect(module.getOutput(outputName)).to.be.instanceOf(Datapoint);
            });

        });

        it('does not call output publish method', function() {
            var module = new SunCalcModule('18:00:00');
            expect(module.getOutput('solarNoon').publish).not.to.be.called;
        });

    });

    describe('starting module', function() {

        it('requests times from mourners suncalc', function() {
            var module = new SunCalcModule(50.783387, 7.156728);

            expect(this.getTimes).not.to.be.called;

            this.setFakeTime("Tue Apr 08 2014 13:34:21");
            module.start();

            expect(this.getTimes).to.be.called;
            expect(this.getTimes).to.be.calledWith(new Date('Tue Apr 08 2014 12:00:00'), 50.783387, 7.156728);
            expect(this.getTimes).to.be.calledWith(new Date('Wed Apr 09 2014 12:00:00'), 50.783387, 7.156728);
        });


        function dateIsAfterNow(date) {
            return date > Date.now();
        }

        timeNames.forEach(function(outputName) {
            it('publishes next ' + outputName + ' to output', function() {

                this.setFakeTime("Wed Apr 09 2014 12:00:00");

                var module = new SunCalcModule(50.783387, 7.156728);
                var output = module.getOutput(outputName).publish;
                module.start();
                expect(output).to.be.calledWith(sinon.match(dateIsAfterNow));
            });
        });

    });

    describe('publishes correct time', function() {

        it('when time on today is reached', function() {
            var module = new SunCalcModule(50.783387, 7.156728),
                output = module.getOutput('goldenHour').publish;

            this.setFakeTime("Wed Apr 09 2014 12:00:00");

            module.start();

            expect(output).to.be.calledWith(new Date("Wed Apr 09 2014 19:31:33"));

            this.clock.tick(7 * 3600000 + 31 * 60000 + 33000);

            expect(output).to.be.calledTwice.and.calledWith(new Date("Thu Apr 10 2014 19:31:33"));
        });

        it('when next match is tomorrow', function() {
            var module = new SunCalcModule(50.783387, 7.156728),
                output = module.getOutput('nightEnd').publish;

            this.setFakeTime("Wed Apr 09 2014 12:00:00");

            module.start();

            expect(output).to.be.calledWith(new Date("Thu Apr 10 2014 04:53:04"));

            this.clock.tick(16 * 3600000 + 53 * 60000 + 4000);

            expect(output).to.be.calledTwice.and.calledWith(new Date("Fri Apr 11 2014 04:53:04"));
        });

        it('for the next two days', function() {
            var module = new SunCalcModule(50.783387, 7.156728),
                output = module.getOutput('nightEnd').publish;

            this.setFakeTime("Wed Apr 09 2014 12:00:00");

            module.start();

            expect(output).to.be.calledWith(new Date("Thu Apr 10 2014 04:53:04"));

            this.clock.tick(16 * 3600000 + 53 * 60000 + 4000);
            expect(output).to.be.calledTwice.and.calledWith(new Date("Fri Apr 11 2014 04:53:04"));

            this.clock.tick(24 * 3600000);
            expect(output).to.be.calledThrice.and.calledWith(new Date("Sat Apr 12 2014 04:53:04"));

            this.clock.tick(24 * 3600000);
            expect(output.callCount).to.be.equal(4);
            expect(output).to.be.calledWith(new Date("Sun Apr 13 2014 04:53:04"));
        });
    });
});