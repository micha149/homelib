var homelib = require('../../homelib'),
    Daytime = homelib.Timer.Daytime,
    RandomOffset = homelib.Timer.RandomOffset,
    Duration = homelib.Timer.Duration,
    UnexpectedValueError = homelib.Error.UnexpectedValueError,
    assert  = require('assert'),
    sinon   = require('sinon');

describe('Timer.RandomOffset', function() {

   describe('constructor', function() {

       it('expects Time instance', function() {
           var time = sinon.createStubInstance(Daytime),
               rand = new RandomOffset(time);

           assert.equal(rand._time, time, 'Time object stored');

           assert.throws(function() {
               rand = new RandomOffset('fooo');
           }, UnexpectedValueError);
       });

       it('has default values for min and max', function() {
           var time = sinon.createStubInstance(Daytime),
               rand = new RandomOffset(time);

           assert.equal(rand._min, -9000, "Min should be -30m");
           assert.ok(rand._min instanceof Duration, "._min is instance of Duration");
           assert.equal(rand._max, 9000, "Max should be +30m");
           assert.ok(rand._max instanceof Duration, "._max is instance of Duration");
       });

       it('can be instanciated with config object', function() {

           var time = sinon.createStubInstance(Daytime),
               rand;

           rand = new RandomOffset({
               time: time,
               min: -8,
               max: 15
           });

           assert.equal(rand._min, -8, "Min was set");
           assert.equal(rand._min, -8, "Max was set");
           assert.equal(rand._time, time, "Time object stored");
       })
   });

   describe('setMin', function() {

       it('accepts number', function() {
           var time = sinon.createStubInstance(Daytime),
               rand = new RandomOffset(time);

           rand.setMin(12345);

           assert.equal(rand._min, 12345);
           assert.ok(rand._min instanceof Duration, "._min is instance of Duration");
       });

       it('accepts duration object', function() {
           var time = sinon.createStubInstance(Daytime),
               dur  = new Duration('2m 29s'),
               rand = new RandomOffset(time);

           rand.setMin(dur);

           assert.equal(rand._min, 149000);
           assert.ok(rand._min instanceof Duration, "._min is instance of Duration");
       });

       it('accepts duration string', function() {
           var time = sinon.createStubInstance(Daytime),
               rand = new RandomOffset(time);

           rand.setMin('2m 29s');

           assert.equal(rand._min, 149000);
           assert.ok(rand._min instanceof Duration, "._min is instance of Duration");
       });
   });

    describe('setMax', function() {

        it('accepts number', function() {
            var time = sinon.createStubInstance(Daytime),
                rand = new RandomOffset(time);

            rand.setMax(12345);

            assert.equal(rand._max, 12345);
            assert.ok(rand._max instanceof Duration, "._max is instance of Duration");
        });

        it('accepts duration object', function() {
            var time = sinon.createStubInstance(Daytime),
                dur  = new Duration('2m 29s'),
                rand = new RandomOffset(time);

            rand.setMax(dur);

            assert.equal(rand._max, 149000);
            assert.ok(rand._max instanceof Duration, "._max is instance of Duration");
        });

        it('accepts duration string', function() {
            var time = sinon.createStubInstance(Daytime),
                rand = new RandomOffset(time);

            rand.setMax('2m 29s');

            assert.equal(rand._max, 149000);
            assert.ok(rand._max instanceof Duration, "._max is instance of Duration");
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