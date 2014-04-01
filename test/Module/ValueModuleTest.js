var sinon = require('sinon'),
    expect = require('chai').expect,
    homelib = require('../../homelib'),
    ValueModule = homelib.Module.ValueModule,
    Datapoint = homelib.Datapoint.Datapoint;

describe('Module.ValueModule', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();

        sandbox.stub(Datapoint, "create", function() {
            return sinon.createStubInstance(Datapoint);
        });

    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('creating an instance', function() {

        it('calls Datapoint factory to create output', function() {
            var module = new ValueModule("1.001", "On");

            expect(Datapoint.create).to.be.calledOnce;
            expect(Datapoint.create).to.be.calledWith("1.001");
            expect(module.getOutput('value')).to.be.instanceOf(Datapoint);
        });

        it('validates given value against datapoint type');

    });

    describe('starting the module', function() {

        it('published value to output', function() {
            var module = new ValueModule("1.001", "On");
            module.start();
            expect(module.getOutput('value').publish).to.be.calledOnce.and.calledWith("On");
        });

    });

});