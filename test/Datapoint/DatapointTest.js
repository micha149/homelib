var homelib = require('../../homelib.js'),
    TimeType = homelib.Datapoint.TimeType,
    Datapoint = homelib.Datapoint.Datapoint,
    UnexpectedValueError = homelib.Error.UnexpectedValueError,
    sinon = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect;

describe('Datapoint', function() {

    describe('Datapoint', function() {

        beforeEach(function() {
            this.type = sinon.createStubInstance(homelib.Datapoint.TimeType)
            this.datapoint = new Datapoint(this.type);
        });

        describe('creating an instance', function() {

            it('stored given type', function() {
                expect(this.datapoint.getType()).to.be.equal(this.type);
            });

            it('throws error if no type is passed', function() {
                expect(function() {
                    new Datapoint();
                }).to.Throw(UnexpectedValueError);
            });

        });

        describe('setting the value', function() {

            it('triggers subscriber', function() {
                var datapoint = this.datapoint,
                    value = 149,
                    spyOne = sinon.spy(),
                    spyTwo = sinon.spy();

                datapoint.subscribe(spyOne);
                datapoint.subscribe(spyTwo);

                datapoint.publish(value);

                expect(spyOne).to.be.calledWith(value).and.calledOn(datapoint);
                expect(spyTwo).to.be.calledWith(value).and.calledOn(datapoint);
            });

            it('triggers new subscriber immediately', function() {
                var datapoint = this.datapoint,
                    value = 149,
                    spy = sinon.spy();

                datapoint.publish(value);
                datapoint.subscribe(spy);

                expect(spy).to.be.calledWith(value).and.calledOn(datapoint);
            });

        });

        describe('removing subscriber', function() {

            it('using unsubscribe()', function() {
                var datapoint = this.datapoint,
                    spy = sinon.spy();

                datapoint.subscribe(spy);

                datapoint.publish("foo");
                datapoint.unsubscribe(spy);
                datapoint.publish("bar");

                expect(spy).to.be.calledOnce;
            });

            it('works automatically with subscribeOnce()', function() {
                var datapoint = this.datapoint,
                    spy = sinon.spy();

                datapoint.subscribeOnce(spy);

                datapoint.publish("foo");
                datapoint.publish("bar");

                expect(spy).to.be.calledOnce;
            });

            it('attached with subscribeOnce() before first call', function() {
                var datapoint = this.datapoint,
                    spy = sinon.spy();

                datapoint.subscribeOnce(spy);
                datapoint.unsubscribe(spy);

                datapoint.publish("bar");

                expect(spy).not.to.be.calledgi;
            });

        });

    });

});