var sinon = require('sinon'),
    expect = require('chai').expect,
    homelib = require('../../homelib'),
    GroupAddress = homelib.GroupAddress,
    Connection = homelib.Connection,
    GroupAddressModule = homelib.Module.GroupAddressModule,
    Datapoint = homelib.Datapoint.Datapoint,
    UnexpectedValueError = homelib.Error.UnexpectedValueError;

describe('Module.GroupAddressModule', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();

        this.connection = sinon.createStubInstance(Connection);

        sandbox.stub(Datapoint, "create", function() {
            return sinon.createStubInstance(Datapoint);
        });

        this.groupAddress = sinon.createStubInstance(homelib.GroupAddress);
        sandbox.stub(GroupAddress, "create").returns(this.groupAddress);


        this.module = new GroupAddressModule('1/2/3', "1.001", this.connection);
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('creating an instance', function() {

        it('calls Datapoint factory to create output and input', function() {
            expect(Datapoint.create).to.be.calledTwice;
            expect(this.module.getOutput('value')).to.be.instanceOf(Datapoint);
            expect(this.module.getInput('value')).to.be.instanceOf(Datapoint);
        });

        it('does not call outputs publish method', function() {
            expect(this.module.getOutput('value').publish).not.to.be.called;
        });

        it('creates group address instance', function() {
            expect(GroupAddress.create).to.be.calledOnce.and.and.calledWith('1/2/3');
        });

    });


    describe('starting the module', function() {

        it('adds listener to connection', function() {
            this.module.start();
            expect(this.connection.on).to.be.calledOnce.and.calledWith(this.groupAddress);
        });

    });

    describe('receiving messages', function() {

        it('passes value of received messages to output', function() {
            var message = sinon.createStubInstance(homelib.Message),
                type = sinon.createStubInstance(homelib.Datapoint.BinaryType),
                spy = sinon.spy(),
                data = [1];

            this.module.getOutput("value").getType.returns(type);
            message.getData.returns(data);
            type.transform.returns(true);
            this.connection.on.yields(message);


            this.module.start();

            expect(type.transform).to.be.calledOnce.and.calledWith(data);
            expect(this.module.getOutput("value").publish).to.be.calledOnce.and.calledWith(true);
        });

    });

    describe('sending messages', function() {

        it('calls send on connection', function() {
            var groupAddress = this.groupAddress,
                type = sinon.createStubInstance(homelib.Datapoint.BinaryType),
                data = [1];

            this.module.getInput("value").getType.returns(type);
            this.module.getInput("value").subscribe.yields(true);
            type.parse.returns(data);

            var messageMatcher = function(msg) {
                expect(msg.getDestination()).to.be.equal(groupAddress);
                expect(msg.getData()).to.be.equal(data);
                return true;
            };

            this.module.start();

            expect(type.parse).to.be.calledOnce.and.calledWith(true);
            expect(this.connection.send).to.be.calledOnce.and.calledWith(sinon.match(messageMatcher));
        });

    });

});