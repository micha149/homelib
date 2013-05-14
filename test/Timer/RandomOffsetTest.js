var homelib = require('../../homelib'),
    Daytime = homelib.Timer.Daytime,
    RandomOffset = homelib.Timer.RandomOffset,
    Duration = homelib.Timer.Duration,
    UnexpectedValueError = require('../../src/Error/UnexpectedValueError'),
    assert  = require('assert'),
    sinon   = require('sinon');

describe('Timer.RandomOffset', function() {

   describe('constructor', function() {

       it('expects Time instance', function() {
           var time = sinon.createStubInstance(Daytime),
               rand = new RandomOffset(time);

           assert.equal(rand.time, time, 'Time object stored');

           assert.throws(function() {
               rand = new RandomOffset('fooo');
           }, UnexpectedValueError);
       });

       it('has default values for min and max', function() {
           var time = sinon.createStubInstance(Daytime),
               rand = new RandomOffset(time);

           assert.equal(rand.min, -9000, "Min should be -30m");
           assert.ok(rand.min instanceof Duration, ".min is instance of Duration");
           assert.equal(rand.max, 9000, "Max should be +30m");
           assert.ok(rand.max instanceof Duration, ".max is instance of Duration");
       });
   });

   describe('setMin', function() {

       it('accepts number', function() {
           var time = sinon.createStubInstance(Daytime),
               rand = new RandomOffset(time);

           rand.setMin(12345);

           assert.equal(rand.min, 12345);
           assert.ok(rand.min instanceof Duration, ".min is instance of Duration");
       });

       it('accepts duration object', function() {
           var time = sinon.createStubInstance(Daytime),
               dur  = new Duration('2m 29s'),
               rand = new RandomOffset(time);

           rand.setMin(dur);

           assert.equal(rand.min, 149000);
           assert.ok(rand.min instanceof Duration, ".min is instance of Duration");
       });

       it('accepts duration string', function() {
           var time = sinon.createStubInstance(Daytime),
               rand = new RandomOffset(time);

           rand.setMin('2m 29s');

           assert.equal(rand.min, 149000);
           assert.ok(rand.min instanceof Duration, ".min is instance of Duration");
       });
   });

    describe('setMax', function() {

        it('accepts number', function() {
            var time = sinon.createStubInstance(Daytime),
                rand = new RandomOffset(time);

            rand.setMax(12345);

            assert.equal(rand.max, 12345);
            assert.ok(rand.max instanceof Duration, ".max is instance of Duration");
        });

        it('accepts duration object', function() {
            var time = sinon.createStubInstance(Daytime),
                dur  = new Duration('2m 29s'),
                rand = new RandomOffset(time);

            rand.setMax(dur);

            assert.equal(rand.max, 149000);
            assert.ok(rand.max instanceof Duration, ".max is instance of Duration");
        });

        it('accepts duration string', function() {
            var time = sinon.createStubInstance(Daytime),
                rand = new RandomOffset(time);

            rand.setMax('2m 29s');

            assert.equal(rand.max, 149000);
            assert.ok(rand.max instanceof Duration, ".max is instance of Duration");
        });
    });

    describe('getNextDate', function() {

        it('adds random value to date from time object', function() {
            var time = sinon.createStubInstance(Daytime),
                rand = new RandomOffset(time);

            sinon.stub(Math, "random");

            time.getNextDate.returns(new Date("Sun May 05 2013 16:00:00 GMT+0200 (CEST)"));
            Math.random.returns(1/3);

            rand.setMin(0);
            rand.setMax('15m');

            assert.deepEqual(rand.getNextDate(), new Date("Sun May 05 2013 16:05:00 GMT+0200 (CEST)"));
            assert.ok(Math.random.calledOnce, "Random number created");

            Math.random.restore();
        });

        it('works with negative values', function() {
            var time = sinon.createStubInstance(Daytime),
                rand = new RandomOffset(time);

            sinon.stub(Math, "random");

            time.getNextDate.returns(new Date("Sun May 05 2013 16:00:00 GMT+0200 (CEST)"));
            Math.random.returns(1/3);

            rand.setMin('-30m');
            rand.setMax('15m');

            assert.deepEqual(rand.getNextDate(), new Date("Sun May 05 2013 15:45:00 GMT+0200 (CEST)"));
            assert.ok(Math.random.calledOnce, "Random number created");

            Math.random.restore();
        });
    });

});