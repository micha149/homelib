var sinon = require('sinon'),
    expect = require('chai').expect,
    homelib = require('../../homelib'),
    BlendsTimerModule = homelib.Module.BlendsTimerModule,
    Datapoint = homelib.Datapoint.Datapoint,
    UnexpectedValueError = homelib.Error.UnexpectedValueError;

describe('Module.BlendsTimerModule', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();

        sandbox.spy(Datapoint, "create");

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
            var blends = new BlendsTimerModule();

            expect(Datapoint.create).to.be.calledThrice;
            expect(blends.getOutput('updown')).to.be.instanceOf(Datapoint);
            expect(blends.getInput('uptime')).to.be.instanceOf(Datapoint);
            expect(blends.getInput('downtime')).to.be.instanceOf(Datapoint);
        });


    });

    describe('starting module', function() {

        it('creates correct timeout for uptime', function() {
            var blends = new BlendsTimerModule(),
                spy = sinon.spy();

            blends.getInput('uptime').publish(new Date('2014-01-20 08:15:00'));
            blends.getInput('downtime').publish(new Date('2014-01-20 18:00:00'));
            blends.getOutput('updown').subscribe(spy);

            this.setFakeTime('2014-01-20 08:00:00');

            blends.start();
            expect(spy).not.to.be.called;

            this.clock.tick(900000); // 15 minutes
            expect(spy).to.be.calledOnce.and.calledWith('up');

            this.clock.tick(35099000); // 09:45:00 - 1 second
            expect(spy).to.be.calledOnce;

            this.clock.tick(1000); // 1 second
            expect(spy).to.be.calledTwice.and.calledWith('down');
        });

    });

    describe('triggering down', function() {

        it('sets new timeout when new downtime is passed after current downtime', function() {
            var blends = new BlendsTimerModule(),
                spy = sinon.spy();

            blends.getInput('downtime').publish(new Date('2014-01-20 20:00:00'));
            blends.getOutput('updown').subscribe(spy);

            this.setFakeTime('2014-01-20 19:59:59');
            blends.start();

            this.clock.tick(1000);
            expect(spy).to.be.calledOnce;

            blends.getInput('downtime').publish(new Date('2014-01-21 20:00:00'));

            this.clock.tick(86400000);
            expect(spy).to.be.calledTwice;
            expect(spy).to.be.always.calledWithExactly("down");
        });

        it('don\'t creates new timeout when new downtime is passed before current downtime', function() {
            var blends = new BlendsTimerModule(),
                spy = sinon.spy();

            blends.getInput('downtime').publish(new Date('2014-01-20 20:00:00'));
            blends.getOutput('updown').subscribe(spy);

            this.setFakeTime('2014-01-20 19:00:00');
            blends.start();

            blends.getInput('downtime').publish(new Date('2014-01-20 19:30:00'));

            this.clock.tick(1800000); // 30min

            expect(spy).not.to.be.called;
            
            this.clock.tick(1800000); // 30min

            expect(spy).to.be.calledOnce;
            expect(spy).to.be.always.calledWithExactly("down");
        });
    });

    describe('triggering up', function() {

        it('sets new timeout when new uptime is passed after current uptime', function() {
            var blends = new BlendsTimerModule(),
                spy = sinon.spy();

            blends.getInput('uptime').publish(new Date('2014-01-20 08:00:00'));
            blends.getOutput('updown').subscribe(spy);

            this.setFakeTime('2014-01-20 07:59:59');
            blends.start();

            this.clock.tick(1000);
            expect(spy).to.be.calledOnce;

            blends.getInput('uptime').publish(new Date('2014-01-21 08:00:00'));

            this.clock.tick(86400000);
            expect(spy).to.be.calledTwice;
        });

        it('don\'t creates new timeout when new uptime is passed before current uptime', function() {
            var blends = new BlendsTimerModule(),
                spy = sinon.spy();

            blends.getInput('uptime').publish(new Date('2014-01-20 08:00:00'));
            blends.getOutput('updown').subscribe(spy);

            this.setFakeTime('2014-01-20 07:00:00');
            blends.start();

            blends.getInput('uptime').publish(new Date('2014-01-20 07:30:00'));

            this.clock.tick(1800000); // 30min

            expect(spy).not.to.be.called;

            this.clock.tick(1800000); // 30min

            expect(spy).to.be.calledOnce;
        });
    });

});