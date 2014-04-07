var sinon = require('sinon'),
    expect = require('chai').expect,
    homelib = require('../../homelib'),
    IfElseModule = homelib.Module.IfElseModule,
    Datapoint = homelib.Datapoint.Datapoint;

describe('Module.IfElseModule', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('creating an instance', function() {

        it('calls Datapoint factory to create output', function() {

            sandbox.spy(Datapoint, "create");

            var module = new IfElseModule();

            expect(Datapoint.create.callCount).to.be.equal(4);
            expect(Datapoint.create).to.be.calledWith("1.001");
            expect(module.getOutput('value')).to.be.instanceOf(Datapoint);
            expect(module.getInput('condition')).to.be.instanceOf(Datapoint);
            expect(module.getInput('if')).to.be.instanceOf(Datapoint);
            expect(module.getInput('else')).to.be.instanceOf(Datapoint);
        });

    });

    describe('starting the module', function() {

        it('publishes value to output', function() {
            var module = new IfElseModule("1.001", "On"),
                spy = sinon.spy();

            module.getOutput('value').subscribe(spy);
            module.getInput('condition').publish("On");
            module.getInput('if').publish("foo");
            module.getInput('else').publish("bar");
            module.start();

            expect(spy).to.be.calledOnce.and.calledWith("foo");
        });

    });

    describe('changing condition', function() {

        it('publishes new value to output', function() {
            var module = new IfElseModule("1.001", "On"),
                spy = sinon.spy();

            module.getInput('condition').publish("On");
            module.getInput('if').publish("foo");
            module.getInput('else').publish("bar");

            module.getOutput('value').subscribe(spy);
            module.start();
            spy.reset();

            module.getInput('condition').publish("Off");
            expect(spy).to.be.calledOnce.and.calledWith("bar");

            module.getInput('condition').publish("On");
            expect(spy).to.be.calledTwice.and.calledWith("foo");
        });

    });

    describe('changing `if` input', function() {

        it('publishes new value to output if condition matches', function() {
            var module = new IfElseModule("1.001", "On"),
                spy = sinon.spy();

            module.getInput('condition').publish("On");
            module.getInput('if').publish("foo");
            module.getInput('else').publish("bar");

            module.getOutput('value').subscribe(spy);
            module.start();
            spy.reset();

            module.getInput('if').publish("new");
            expect(spy).to.be.calledOnce.and.calledWith("new");
        });

        it('does nothing if condition don\'t match', function() {
            var module = new IfElseModule("1.001", "On"),
                spy = sinon.spy();

            module.getInput('condition').publish("Off");
            module.getInput('if').publish("foo");
            module.getInput('else').publish("bar");

            module.getOutput('value').subscribe(spy);
            module.start();
            spy.reset();

            module.getInput('if').publish("new");
            expect(spy).not.to.be.called;
        });

    });

    describe('changing `else` input', function() {

        it('publishes new value to output if condition matches don\'t match', function() {
            var module = new IfElseModule("1.001", "On"),
                spy = sinon.spy();

            module.getInput('condition').publish("Off");
            module.getInput('if').publish("foo");
            module.getInput('else').publish("bar");

            module.getOutput('value').subscribe(spy);
            module.start();
            spy.reset();

            module.getInput('else').publish("baz");
            expect(spy).to.be.calledOnce.and.calledWith("baz");
        });

        it('does nothing if condition matches', function() {
            var module = new IfElseModule("1.001", "On"),
                spy = sinon.spy();

            module.getInput('condition').publish("On");
            module.getInput('if').publish("foo");
            module.getInput('else').publish("bar");

            module.getOutput('value').subscribe(spy);
            module.start();
            spy.reset();

            module.getInput('else').publish("baz");
            expect(spy).not.to.be.called;
        });

    });

});