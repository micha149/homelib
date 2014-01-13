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

        it('binds callback to drivers `message` event', function() {

            var driver = sinon.createStubInstance(Driver),
                connection;

            sandbox.stub(Connection.prototype, '_onDriverMessage');
            driver.on.withArgs('message').yields();

            connection = new Connection(driver);

            expect(connection._onDriverMessage).to.be.calledOnce;
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

        it('calls listener if driver emits message',  function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                msg        = sinon.createStubInstance(Message),
                rawAddress = [0x22, 0x9b],
                callback   = sinon.spy(),
                connection;

            driver.on.restore();
            driver.emit.restore();

            connection = new Connection(driver);

            address.getRaw.returns(rawAddress);
            msg.getDestination.returns(address);

            connection.on(address, callback);

            driver.emit("message", msg);
            expect(callback).to.be.calledOnce
                .and.calledWith(msg);
        });

        it('is able to handle multiple callbacks',  function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                msg        = sinon.createStubInstance(Message),
                rawAddress = [0x22, 0x9b],
                callbackA   = sinon.spy(),
                callbackB   = sinon.spy(),
                connection;

            driver.on.restore();
            driver.emit.restore();

            connection = new Connection(driver);

            address.getRaw.returns(rawAddress);
            msg.getDestination.returns(address);

            connection.on(address, callbackA);
            connection.on(address, callbackB);

            driver.emit("message", msg);
            expect(callbackA).to.be.calledOnce.and.calledWith(msg);
            expect(callbackB).to.be.calledOnce.and.calledWith(msg);
        });
    });
});