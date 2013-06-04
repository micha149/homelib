var sinon = require('sinon'),
    assert = require('assert'),
    homelib = require('../homelib'),
    Connection = homelib.Connection,
    GroupAddress = homelib.GroupAddress,
    PhysicalAddress = homelib.PhysicalAddress,
    Message = homelib.Message,
    Driver = homelib.Driver.Driver;

describe('Connection', function() {

    describe('constructor', function() {

        it('needs a driver', function() {
            
            var driver     = sinon.createStubInstance(Driver),
                connection = new Connection(driver);

            assert.throws(function() {
                connection = new Connection();
            });
        });

        it('binds callback to drivers `message` event', function() {

            var driver     = sinon.createStubInstance(Driver),
                driverMock = sinon.mock(driver, 'on'),
                connection;

            sinon.stub(Connection.prototype, '_onDriverMessage');

            driver.on.restore();
            driverMock.expects('on')
                      .withArgs('message')
                      .callsArg(1);

            connection = new Connection(driver)

            driverMock.verify();

            assert.ok(connection._onDriverMessage.calledOnce, "Driver message callback bound");

            Connection.prototype._onDriverMessage.restore();
        });

    });
    
    describe('.send()', function() {
        it('calls connect on driver if driver is not connected', function() {

            var driver     = sinon.createStubInstance(Driver),
                msg        = sinon.createStubInstance(Message),
                connection = new Connection(driver);

            driver.isConnected.returns(false);

            connection.send(msg);

            assert.ok(driver.isConnected.calledOnce, "Check for connection");
            assert.ok(driver.connect.calledOnce, "Called connect");
        });

        it('calls not connect on driver if driver is already connected', function() {

            var driver     = sinon.createStubInstance(Driver),
                msg        = sinon.createStubInstance(Message),
                connection = new Connection(driver);

            driver.isConnected.returns(true);

            connection.send(msg);

            assert.ok(!driver.connect.called, "Connect wasn't called");
        });

        it('calls send() on driver', function() {

            var driver     = sinon.createStubInstance(Driver),
                msg        = sinon.createStubInstance(Message),
                callback   = function() {},
                connection = new Connection(driver);

            driver.isConnected.returns(true);

            connection.send(msg, callback);

            assert.ok(driver.send.calledOnce, "Send was called");
            assert.deepEqual(driver.send.firstCall.args[0], msg, "Message passed");
            assert.deepEqual(driver.send.firstCall.args[1], callback, "Callback passed");
        });

        it('calls send() on driver after connection was established', function() {

            var driver     = sinon.createStubInstance(Driver),
                msg        = sinon.createStubInstance(Message),
                callback   = function() {},
                connection = new Connection(driver);

            driver.isConnected.returns(false);

            connection.send(msg, callback);

            assert.ok(!driver.send.called, "Send was not called yet");
            driver.connect.firstCall.args[0].call(driver);
            assert.ok(driver.send.calledOnce, "Send was called after connect");
            assert.deepEqual(driver.send.firstCall.args[0], msg, "Message passed");
            assert.deepEqual(driver.send.firstCall.args[1], callback, "Callback passed");
        });

    });
    
    describe('.on()', function() {

        it('calls connect on driver if driver is not connected', function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                connection = new Connection(driver);

            driver.isConnected.returns(false);

            connection.on(address, function() {});

            assert.ok(driver.isConnected.calledOnce, "Check for connection");
            assert.ok(driver.connect.calledOnce, "Called connect");
        });

        it('calls not connect on driver if driver is already connected', function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                connection = new Connection(driver);

            driver.isConnected.returns(true);

            connection.on(address, function() {});

            assert.ok(!driver.connect.called, "Connect wasn't called");
        });

        it('adds group address to the listeners array',  function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                rawAddress = [0x22, 0x9b],
                callback   = function() {},
                connection = new Connection(driver);

            address.getRaw.returns(rawAddress);

            connection.on(address, callback);

            assert.equal(connection._listeners[rawAddress][0], callback);

        });

        it('is able to handle multiple callbacks',  function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                rawAddress = [0x22, 0x9b],
                callbackA   = function() {},
                callbackB   = function() {},
                connection = new Connection(driver);

            address.getRaw.returns(rawAddress);

            connection.on(address, callbackA);
            connection.on(address, callbackB);

            assert.equal(connection._listeners[rawAddress].length, 2, "Has two callbacks");
            assert.equal(connection._listeners[rawAddress][0], callbackA, "Callback A added");
            assert.equal(connection._listeners[rawAddress][1], callbackB, "Callback B added");
        });
    });

    describe('_onDriverMessage()', function() {

        it('triggers each callback for matching address', function() {

            var driver     = sinon.createStubInstance(Driver),
                address    = sinon.createStubInstance(GroupAddress),
                message    = sinon.createStubInstance(Message),
                rawAddress = [0x22, 0x9b],
                callbackA   = sinon.spy(),
                callbackB   = sinon.spy(),
                connection = new Connection(driver);

            address.getRaw.returns(rawAddress);
            message.getDestination.returns(address);

            connection.on(address, callbackA);
            connection.on(address, callbackB);

            connection._onDriverMessage(message);

            assert.ok(callbackA.calledOnce, "Callback A called");
            assert.equal(callbackA.firstCall.args[0], message, "Message passed");
            assert.ok(callbackB.calledOnce, "Callback B called");
        });
    })
    
});