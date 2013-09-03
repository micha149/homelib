var Buffer = require('buffer').Buffer,
    homelib = require('../../homelib.js'),
    KnxIp = homelib.Driver.KnxIp,
    Log = homelib.Log,
    KnxIpDriver = homelib.Driver.KnxIpDriver,
    Message = homelib.Message,
    dgram = require('dgram'),
    assert = require('assert'),
    sinon = require('sinon'),
    implements = homelib.assert.implements;

describe('KnxIpDriver', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        sandbox.stub(dgram, 'createSocket', function(type, callback) {
            var socket = new dgram.Socket(type, callback);
            sandbox.stub(socket, "send");
            return socket;
        });
    });

    afterEach(function() {
        sandbox.restore();
    });

    it ('Implements driver interface', function() {
        var driver = new KnxIpDriver({
            remoteAddress: '127.0.0.1'
        });

        implements(driver, homelib.Driver.DriverInterface);
    });

    describe('constructor', function() {

        it('sets default options', function() {
            var driver = new KnxIpDriver({
                remoteAddress: '127.0.0.1'
            });

            assert.equal(driver.options.remotePort, 3671, "Remote port is correct");
            assert.equal(driver.options.localAddress, undefined, "Local address is correct");
            assert.equal(driver.options.localPort, 3672, "Local port is correct");
            assert.ok(driver._log instanceof Log.NullLogger, 'null logger is set');
        });

        it('takes options from given object', function() {
            var driver = new KnxIpDriver({
                remoteAddress: '127.0.0.1',
                remotePort: 12345,
                localAddress: '192.168.0.223',
                localPort: 54321
            });

            assert.equal(driver.options.remoteAddress, '127.0.0.1', "Remote address is correct");
            assert.equal(driver.options.remotePort, 12345, "Remote port is correct");
            assert.equal(driver.options.localAddress, '192.168.0.223', "Local address is correct");
            assert.equal(driver.options.localPort, 54321, "Local port is correct");
        });

        it('throws exception if no remote address option is set', function() {
            assert.throws(function() {
                var driver = new KnxIpDriver({
                    remotePort: 12345
                });
            });
        });

    });

    describe('.connect()', function() {

        var expectedAddress = "192.168.123.123",
            expectedPort    = 12345,
            expectedRequest = new Buffer([0x01, 0x02, 0x03]),
            connectionRequestStub,
            driver;

        beforeEach(function() {

            connectionRequestStub = sinon.createStubInstance(KnxIp.ConnectionRequest);
            connectionRequestStub.toBuffer.returns(expectedRequest);

            driver = new KnxIpDriver({
                remoteAddress: expectedAddress,
                remotePort: expectedPort
            });
            sandbox.stub(driver, '_createConnectionRequest').returns(connectionRequestStub);
        });

        it('sends connection request and waits for connection response', function() {

            var expectedChannelId = 96,
                expectedPacket = new KnxIp.Packet(0x0206, [expectedChannelId, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x38, 0x65, 0x0e, 0x57, 0x04, 0x04, 0x00, 0x00]),
                connectedSpy     = sandbox.spy();

            driver.on('connected', connectedSpy);

            driver.connect();
            assert.ok(dgram.createSocket.calledWithExactly('udp4'), 'Created an udp4 socket');
            assert.ok(driver._socket instanceof dgram.Socket, 'Socket stored in object property');
            assert.ok(driver._socket.send.calledOnce, 'Send was called once');
            assert.ok(driver._socket.send.calledWith(expectedRequest), 'Passed correct buffer');
            assert.ok(connectedSpy.notCalled, "connect event should not be triggered");

            driver.emit('packet', expectedPacket);
            driver.emit('packet', expectedPacket); // This should not cause a second call

            assert.equal(driver._channelId, expectedChannelId, "Channel id stored");
            assert.ok(connectedSpy.calledOnce, "connect event should now be triggered");
        });

        it('does not trigger tunnel request on other messages', function() {
            var unexpectedPacket = new KnxIp.Packet(0x0420, [0x01, 0x02, 0x03]),
                expectedPacket  = new KnxIp.Packet(0x0206, [0x01, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x38, 0x65, 0x0e, 0x57, 0x04, 0x04, 0x00, 0x00]),
                connectedSpy     = sandbox.spy();

            driver.on('connected', connectedSpy);

            driver.connect();

            driver.emit('packet', unexpectedPacket);
            assert.ok(connectedSpy.notCalled, "connect event should not be triggered");

            driver.emit('packet', expectedPacket);
            assert.ok(connectedSpy.calledOnce, "connect event should yet be triggered");
        });

    });

    describe('._createConnectionRequest()', function() {

        it('returns request instance based on options', function() {
            var request,
                clientAddress = '192.168.0.223',
                clientPort = 54321,
                serverAddress = '127.0.0.1',
                serverPort = 12345,
                driver = new KnxIpDriver({
                    remoteAddress: serverAddress,
                    remotePort: serverPort,
                    localAddress: clientAddress,
                    localPort: clientPort
                });

            request = driver._createConnectionRequest();

            assert.ok(request instanceof KnxIp.ConnectionRequest, "Connection Request instance returned");
            assert.deepEqual(request._client, new KnxIp.Hpai(clientAddress, clientPort));
            assert.deepEqual(request._server, new KnxIp.Hpai(clientAddress, clientPort));
        });

    });

    describe('._socketSend', function() {

        it('passes data to socket with host from options', function() {
            var socket = new dgram.Socket('udp4'),
                remoteAddress = "123.123.123.123",
                remotePort = 12345,
                driver = new KnxIpDriver({
                    remoteAddress: remoteAddress,
                    remotePort: remotePort,
                    localAddress: '127.0.0.1'
                }),
                expectedBuffer = new Buffer([1,4,9]);

            sandbox.stub(socket, "send");
            driver._socket = socket;

            driver._socketSend(expectedBuffer);

            assert.ok(socket.send.calledOnce, "send() on socket called");
            assert.ok(socket.send.calledWith(expectedBuffer, 0, 3, remotePort, remoteAddress), "Buffer and host informations passed");
        });

    });

    describe('._sendAndExpect', function() {

        var driver, clock;

        beforeEach(function() {
            clock = sandbox.useFakeTimers();
            driver = new KnxIpDriver({
                remoteAddress: '127.0.0.1',
                localAddress: '127.0.0.1',
                maxRepeats: 3
            });

            sinon.stub(driver, '_socketSend');
        });

        it('sends the given packet to the socket', function() {
            var expectedBytes = [0x06, 0x10, 0x04, 0x02, 0x00, 0x00],
                packet = new KnxIp.Packet(0x0402, []);

            sinon.stub(packet, 'toBuffer').returns(expectedBytes);

            driver._sendAndExpect(packet, 'connection.response');
            assert.ok(driver._socketSend.calledOnce, "Send called");
            assert.ok(driver._socketSend.calledWith(expectedBytes), "Send called");
        });

        it('will retry to send if no answer returned after 1000ms', function() {
            var expectedBytes = [0x06, 0x10, 0x04, 0x02, 0x00, 0x00],
                packet = new KnxIp.Packet(0x0402, []);

            sinon.stub(packet, 'toBuffer').returns(expectedBytes);

            driver._sendAndExpect(packet, 'connection.response');
            clock.tick(1000);

            assert.ok(driver._socketSend.calledTwice, "Send called two times");
            assert.ok(driver._socketSend.alwaysCalledWith(expectedBytes), "Passed always expected bytes");
        });

        it('will retry to send if no answer returned after 2000ms', function() {
            var expectedBytes = [0x06, 0x10, 0x04, 0x02, 0x00, 0x00],
                packet = new KnxIp.Packet(0x0402, []);

            sinon.stub(packet, 'toBuffer').returns(expectedBytes);

            driver._sendAndExpect(packet, 'connection.response');
            clock.tick(2000);

            assert.ok(driver._socketSend.calledThrice, "Send called three times");
            assert.ok(driver._socketSend.alwaysCalledWith(expectedBytes), "Passed always expected bytes");
        });

        it('will not retry more than 3 times', function() {
            var expectedBytes = [0x06, 0x10, 0x04, 0x02, 0x00, 0x00],
                packet = new KnxIp.Packet(0x0402, []);

            sinon.stub(packet, 'toBuffer').returns(expectedBytes);

            driver._sendAndExpect(packet, 'connection.response');
            clock.tick(5000);

            assert.ok(driver._socketSend.calledThrice, "Send called three times");
            assert.ok(driver._socketSend.alwaysCalledWith(expectedBytes), "Passed always expected bytes");
        });

        it('will cancel further repeats if expected answer was received', function() {
            var expectedBytes = [0x06, 0x10, 0x04, 0x02, 0x00, 0x00],
                request = new KnxIp.Packet(0x0205, []),
                response = new KnxIp.Packet(0x206, []);

            sinon.stub(request, 'toBuffer').returns(expectedBytes);

            driver._sendAndExpect(request, 'connection.response');
            clock.tick(1000);

            assert.ok(driver._socketSend.calledTwice, "Send called two times");
            driver.emit('packet', response);

            clock.tick(1000);
            assert.ok(driver._socketSend.calledTwice, "Send should not be called anymore");
        });

        it('call the callback if the expected response is received', function() {
            var expectedBytes = [0x06, 0x10, 0x04, 0x02, 0x00, 0x00],
                request  = new KnxIp.Packet(0x0205, []),
                response = new KnxIp.Packet(0x206, []),
                callback = sinon.spy();

            sinon.stub(request, 'toBuffer').returns(expectedBytes);

            driver._sendAndExpect(request, 'connection.response', callback);
            driver.emit('packet', response);

            assert.ok(callback.calledOnce, "callback called");
            assert.ok(callback.calledWith(response), "packet passed to callback");
            assert.ok(callback.calledOn(driver), "passed driver as `this` to callback");
        });

        it('will not call the callback multiple times', function() {
            var expectedBytes = [0x06, 0x10, 0x04, 0x02, 0x00, 0x00],
                request  = new KnxIp.Packet(0x0205, []),
                response = new KnxIp.Packet(0x206, []),
                callback = sinon.spy();

            sinon.stub(request, 'toBuffer').returns(expectedBytes);

            driver._sendAndExpect(request, 'connection.response', callback);
            driver.emit('packet', response);
            driver.emit('packet', response);

            assert.ok(callback.calledOnce, "callback called once");
        });
    });

    describe('_onSocketMessage', function() {

        var driver;

        beforeEach(function() {
            driver = new KnxIpDriver({
                remoteAddress: '127.0.0.1',
                localAddress: '127.0.0.1'
            });

            driver._channelId = 2;
        });

        it('passes received buffer to packet factory', function() {
            var buffer = new Buffer([4, 7, 1, 1]);

            sandbox.stub(KnxIp.Packet, 'factory');

            driver._onSocketMessage(buffer);

            assert.ok(KnxIp.Packet.factory.calledOnce, "parse on Packet called");
            assert.ok(KnxIp.Packet.factory.calledWith(buffer), "passed buffer to parse method");
        });
    });

    describe('_onPacket', function() {

        var driver;

        beforeEach(function() {
            driver = new KnxIpDriver({
                remoteAddress: '127.0.0.1',
                localAddress: '127.0.0.1'
            });

            sandbox.stub(driver, 'isConnected').returns(true);
            sandbox.stub(driver, '_socketSend');
            driver._channelId = 2;
        });

        it('is called by event listener');

        it('sends a tunneling.ack if a tunneling.request is received', function() {
            var packet    = sinon.createStubInstance(KnxIp.TunnelingRequest),
                channelId = 2,
                sequence  = 128,
                expected  = new KnxIp.TunnelingAck(channelId, sequence, 0x00).toBuffer();

            packet.getServiceName.returns('tunneling.request');
            packet.getChannelId.returns(channelId);
            packet.getSequence.returns(sequence);

            driver._onPacket(packet);

            assert.ok(driver._socketSend.calledOnce, "sent message to socket");
            assert.deepEqual(driver._socketSend.firstCall.args[0], expected);
        });

        it('triggers `message` event if a tunneling.request is received', function() {
            var packet  = sinon.createStubInstance(KnxIp.TunnelingRequest),
                message = sinon.createStubInstance(Message),
                spy     = sinon.spy();

            packet.getServiceName.returns('tunneling.request');
            packet.getMessage.returns(message);

            driver.on('message', spy);

            driver._onPacket(packet);

            assert.ok(spy.calledOnce, "event listener called");
            assert.ok(spy.calledWithExactly(message), "called with expected message");
        });
    });
});