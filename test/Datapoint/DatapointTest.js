var homelib = require('../../homelib.js'),
    TimeType = homelib.Datapoint.TimeType,
    Datapoint = homelib.Datapoint.Datapoint,
    UnexpectedValueError = homelib.Error.UnexpectedValueError,
    TypeFactory = homelib.Datapoint.TypeFactory,
    sinon = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect;

require('../sandbox');

describe('Datapoint', function() {

    describe('Datapoint', function() {

        beforeEach(function() {
            this.type = sinon.createStubInstance(homelib.Datapoint.TimeType);
            this.datapoint = new Datapoint(this.type);
        });

        describe('creating an instance', function() {

            it('stored given type', function() {
                expect(this.datapoint.getType()).to.be.equal(this.type);
            });

            it('throws error if no type is passed', function() {
                expect(function() {
                    var datapoint = new Datapoint();
                }).to.Throw(UnexpectedValueError);
            });

            it('using factory', function() {
                var typeId = '10.001',
                    expectedType = sinon.createStubInstance(homelib.Datapoint.AbstractType),
                    datapoint;

                this.sandbox.stub(TypeFactory, "create");
                TypeFactory.create.returns(expectedType);
                datapoint = Datapoint.create(typeId);

                expect(TypeFactory.create).to.be.calledOnce.and.calledWith(typeId);
                expect(datapoint).to.be.instanceOf(Datapoint);
                expect(datapoint.getType()).to.be.equal(expectedType);
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

                expect(spyOne).to.be.calledWith(value);
                expect(spyTwo).to.be.calledWith(value);
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