var sinon = require('sinon'),
    expect  = require('chai').expect,
    homelib = require('../homelib'),
    Connection = homelib.Connection,
    GroupAddress = homelib.GroupAddress,
    PhysicalAddress = homelib.PhysicalAddress,
    Message = homelib.Message,
    Driver = homelib.Driver.DriverInterface;

describe('Connection', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('creating an instance', function() {

        it('needs a driver', function() {
            
            var driver     = sinon.createStubInstance(Driver),
                connection = new Connection(driver);

            expect(function() {
                connection = new Connection();
            }).to.Throw(Error);
        });
        
    });
    
    describe('sending messages', function() {
        it('calls connect on driver if driver is not connected', function() {

            var driver     = sinon.createStubInstance(Driver),
                msg        = sinon.createStubInstance(Message),
                connection = new Connection(driver);

            driver.isConnected.returns(false);

            connection.send(msg);

            expect(driver.isConnected).to.be.calledOnce;
            expect(driver.connect).to.be.calledOnce.and.calledAfter(driver.isConnected);
        });

        it('calls not connect on driver if driver is already connected', function() {

            var driver     = sinon.createStubInstance(Driver),
                msg        = sinon.createStubInstance(Message),
                connection = new Connection(driver);

            driver.isConnected.returns(true);

            connection.send(msg);

            expect(driver.connect).not.to.be.called;
        });

        it('calls send() on driver', function() {

            var driver     = sinon.createStubInstance(Driver),
                msg        = sinon.createStubInstance(Message),
                callback   = function() {},
                connection = new Connection(driver);

            driver.isConnected.returns(true);

            connection.send(msg, callback);

            expect(driver.send).to.be.calledOnce;
            expect(driver.send).to.be.calledWith(msg, callback);
        });

        it('calls send() on driver after connection was established', function() {

            var driver     = sinon.createStubInstance(Driver),
                msg        = sinon.createStubInstance(Message),
                callback   = function() {},
                connection = new Connection(driver);

            driver.isConnected.returns(false);
            driver.connect.yieldsOn(driver);

            connection.send(msg, callback);

            expect(driver.send).to.be.calledOnce
                .and.calledAfter(driver.connect)
                .and.calledWith(msg, callback);
        });

    });
    
    describe('listening to messages', function() {

        it('calls connect on driver if driver is not connected', function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                connection = new Connection(driver);

            driver.isConnected.returns(false);

            connection.on(address, function() {});

            expect(driver.isConnected).to.be.calledOnce;
            expect(driver.connect).to.be.calledOnce
                .and.calledAfter(driver.isConnected);
        });

        it('calls not connect on driver if driver is already connected', function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                connection = new Connection(driver);

            driver.isConnected.returns(true);

            connection.on(address, function() {});

            expect(driver.connect).not.to.be.called;
        });

        it('calls listener if driver emits write message',  function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                msg        = sinon.createStubInstance(Message),
                numAddress = 2563,
                callback   = sinon.spy(),
                connection;

            driver.on.restore();
            driver.emit.restore();

            connection = new Connection(driver);

            address.getNumber.returns(numAddress);
            msg.getDestination.returns(address);
            msg.getCommand.returns('write');

            connection.on(address, callback);

            driver.emit("message", msg);
            expect(callback).to.be.calledOnce
                .and.calledWith(msg);
        });

        it('is able to handle multiple callbacks',  function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                msg        = sinon.createStubInstance(Message),
                numAddress = 8859,
                callbackA   = sinon.spy(),
                callbackB   = sinon.spy(),
                connection;

            msg.getCommand.returns('write');
            driver.on.restore();
            driver.emit.restore();

            connection = new Connection(driver);

            address.getNumber.returns(numAddress);
            msg.getDestination.returns(address);

            connection.on(address, callbackA);
            connection.on(address, callbackB);

            driver.emit("message", msg);
            expect(callbackA).to.be.calledOnce.and.calledWith(msg);
            expect(callbackB).to.be.calledOnce.and.calledWith(msg);
        });

    });

    describe("Removing listeners", function() {



        beforeEach(function() {

            var addressCounter = 1;

            this.driver = sinon.createStubInstance(Driver);
            this.driver.on.restore();
            this.driver.emit.restore();

            this.createGroupAddress = function() {
                var address = sinon.createStubInstance(GroupAddress);
                address.getNumber.returns(addressCounter++);
                return address;
            };

        });

        it("removes all listeners for a given address", function() {
            var callbackA = sinon.spy(),
                callbackB = sinon.spy(),
                address = this.createGroupAddress(),
                connection = new Connection(this.driver),
                msg = sinon.createStubInstance(Message);

            msg.getCommand.returns('write');
            msg.getDestination.returns(address);

            connection.on(address, callbackA);
            connection.on(address, callbackB);

            connection.off(address);

            this.driver.emit("message", msg);

            expect(callbackA).not.to.to.be.called;
            expect(callbackB).not.to.to.be.called;
        });

        it('removes listeners for a given callback', function() {
            var callbackA = sinon.spy(),
                callbackB = sinon.spy(),
                address = this.createGroupAddress(),
                connection = new Connection(this.driver),
                msg = sinon.createStubInstance(Message);

            msg.getCommand.returns('write');
            msg.getDestination.returns(address);

            connection.on(address, callbackA);
            connection.on(address, callbackB);

            connection.off(address, callbackA);

            this.driver.emit("message", msg);

            expect(callbackA).not.to.to.be.called;
            expect(callbackB).to.to.be.called;
        });

    });

    describe("Reading from a group address", function() {

        it('sends read message on driver', function() {
            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                spy        = sinon.spy(),
                expected   = new Message(),
                connection = new Connection(driver);

            driver.isConnected.returns(true);

            connection.read(address, spy);

            expected.setCommand('read');
            expected.setDestination(address);

            expect(spy).not.to.be.called;
            expect(driver.send).to.be.calledOnce.and.calledWith(expected);
        });

        it('calls callback when answer message is received', function() {
            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                spy        = sinon.spy(),
                answer     = sinon.createStubInstance(Message),
                connection;

            driver.isConnected.returns(true);
            driver.on.restore();
            driver.emit.restore();

            address.toString.returns('1/2/3');

            answer.getCommand.returns('answer');
            answer.getDestination.returns(address);

            connection = new Connection(driver);

            connection.read(address, spy);
            driver.emit('message', answer);

            expect(spy).to.be.called;
        });

        it('sends only on read message for multiple read requests', function() {
            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                spyOne     = sinon.spy(),
                spyTwo     = sinon.spy(),
                expected   = new Message(),
                answer     = sinon.createStubInstance(Message),
                connection;

            driver.isConnected.returns(true);
            driver.on.restore();
            driver.emit.restore();

            address.toString.returns('1/2/3');

            expected.setCommand('read');
            expected.setDestination(address);

            answer.getCommand.returns('answer');
            answer.getDestination.returns(address);

            connection = new Connection(driver);

            connection.read(address, spyOne);
            expect(driver.send).to.be.calledOnce.and.calledWith(expected);

            connection.read(address, spyTwo);
            expect(driver.send).to.be.calledOnce;

            driver.emit('message', answer);

            expect(spyOne).to.be.called;
            expect(spyTwo).to.be.called;
        });

    });

    describe("Shorthand for writing on bus", function() {

        it("sends write message on driver", function() {
            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                spy        = sinon.spy(),
                expected   = new Message(),
                expectedData = [1, 4, 9],
                connection = new Connection(driver);

            driver.isConnected.returns(true);

            connection.write(address, expectedData, spy);

            expected.setCommand('write');
            expected.setDestination(address);
            expected.setData(expectedData);

            expect(driver.send).to.be.calledOnce.and.calledWith(expected);
            expect(spy).not.to.be.called;
        });

        it("calls given callback when driver has sent message", function() {
            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                spy        = sinon.spy(),
                connection = new Connection(driver);

            driver.isConnected.returns(true);
            driver.send.yields();

            connection.write(address, [0], spy);

            expect(driver.send).to.be.calledOnce;
            expect(spy).to.be.called;
        });

    });

    describe("Terminating a connection", function() {

        it('calls disconect() on driver', function() {
            var driver = sinon.createStubInstance(Driver),
                connection;

            driver.isConnected.returns(true);
            
            connection = new Connection(driver);

            connection.disconnect();

            expect(driver.disconnect).to.be.calledOnce;
        });
    });

});