var homelib = require('../../homelib.js'),
    TimeType = homelib.Datapoint.TimeType,
    Datapoint = homelib.Datapoint.Datapoint,
    UnexpectedValueError = homelib.Error.UnexpectedValueError,
    TypeFactory = homelib.Datapoint.TypeFactory,
    sinon = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect;

require('../sandbox');

describe('Datapoint.Datapoint', function() {

    beforeEach(function() {
        this.type = sinon.createStubInstance(homelib.Datapoint.TimeType);
        this.datapoint = new Datapoint(this.type);
    });

    describe('creating an instance', function() {

        it('stored given type', function() {
            expect(this.datapoint.getType()).to.be.equal(this.type);
            expect(this.datapoint.hasType()).to.be.true;
        });

        it('type is not mandatory', function() {
            var datapoint = new Datapoint();
            expect(datapoint.hasType()).to.be.false;
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

    describe('adding a subscriber', function() {

        it('triggers new subscriber immediately if a value was published before', function() {
            var datapoint = this.datapoint,
                value = 149,
                spy = sinon.spy();

            datapoint.publish(value);
            datapoint.subscribe(spy);

            expect(spy).to.be.calledWith(value);
        });

        it("calls publish of given datapoitn with correct scope", function() {
            var value = 149,
                datapoint = this.datapoint,
                anotherDatapoint = sinon.createStubInstance(Datapoint);

            datapoint.publish(value);

            datapoint.subscribe(anotherDatapoint);

            expect(anotherDatapoint.publish).to.be.calledOnce;
            expect(anotherDatapoint.publish).to.be.calledWith(149);
            expect(anotherDatapoint.publish).to.be.calledOn(anotherDatapoint);
        });

        it('throws error if oppiste datapoint has other type', function() {
            var datapoint = this.datapoint,
                opposite = sinon.createStubInstance(Datapoint);

            opposite.hasType.returns(true);
            opposite.getType.returns(sinon.createStubInstance(homelib.Datapoint.BinaryType));

            expect(function() {
                datapoint.subscribe(opposite);
            }).to.Throw(UnexpectedValueError);
        });

        it('accepts datapoint with no type', function() {
            var datapoint = this.datapoint,
                opposite = sinon.createStubInstance(Datapoint);

            opposite.hasType.returns(false);

            expect(function() {
                datapoint.subscribe(opposite);
            }).not.to.Throw(UnexpectedValueError);
        });

        it('accepts datapoint with some type if itself has no type', function() {
            var datapoint = new Datapoint(),
                opposite = sinon.createStubInstance(Datapoint);

            opposite.hasType.returns(true);
            opposite.getType.returns(sinon.createStubInstance(homelib.Datapoint.BinaryType));

            expect(function() {
                datapoint.subscribe(opposite);
            }).not.to.Throw(UnexpectedValueError);
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

        it('triggers publish of given datapoint with correct scope', function() {
            var value = 149,
                datapoint = this.datapoint,
                anotherDatapoint = sinon.createStubInstance(Datapoint);

            datapoint.subscribe(anotherDatapoint);

            datapoint.publish(value);

            expect(anotherDatapoint.publish).to.be.calledOnce;
            expect(anotherDatapoint.publish).to.be.calledWith(149);
            expect(anotherDatapoint.publish).to.be.calledOn(anotherDatapoint);
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

        it('if another datapoint was used', function() {
            var datapoint = this.datapoint,
                anotherDatapoint = sinon.createStubInstance(Datapoint);

            datapoint.subscribe(anotherDatapoint);

            datapoint.publish("foo");
            datapoint.unsubscribe(anotherDatapoint);
            datapoint.publish("bar");

            expect(anotherDatapoint.publish).to.be.calledOnce.and.calledWith("foo");
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