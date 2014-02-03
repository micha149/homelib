var Buffer = require('buffer').Buffer,
    homelib = require('../../homelib.js'),
    KnxIp = homelib.Driver.KnxIp,
    Log = homelib.Log,
    KnxIpDriver = homelib.Driver.KnxIpDriver,
    Message = homelib.Message,
    dgram = require('dgram'),
    sinon = require('sinon'),
    chai    = require('chai'),
    assert = chai.assert,
    expect  = chai.expect,
    implements = homelib.assert.implements;

describe('KnxIpDriver', function() {

    var sandbox;

    beforeEach(function() {
        var self = this,
            nextPort = 5001;

        sandbox = sinon.sandbox.create();

        sandbox.stub(dgram, 'createSocket', function(type, callback) {
            var socket = new dgram.Socket(type, callback);
            sandbox.stub(socket, "bind").yields();
            sandbox.stub(socket, "send");

            sandbox.stub(socket, "address").returns({
                port: nextPort++,
                address: "192.168.0.92"
            });

            return socket;
        });

        this.driver = new KnxIpDriver({
            localAddress: "192.168.0.92",
            remoteAddress: "192.168.0.10"
        });
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('creating an instance', function() {

        it ('implements driver interface', function() {
            implements(this.driver, homelib.Driver.DriverInterface);
        });

        it('throws error if remote address is not set', function() {

            function createInstanceWithMissingOption () {
                var driver = new KnxIpDriver({
                    localAddress: "192.168.0.92"
                });
            }

            expect(createInstanceWithMissingOption).to.throw(Error, /Missing.*remoteAddress/);
        });

        it('uses default remote port 3671', function() {
            var options = this.driver.getOptions();
            expect(options.remotePort).to.be.equal(3671);
        });

    });

    describe('opening connection', function() {

        var expectedRequest = new Buffer([0x01, 0x02, 0x03]),
            connectionRequestStub;

        beforeEach(function() {

            connectionRequestStub = sinon.createStubInstance(KnxIp.ConnectionRequest);
            connectionRequestStub.toBuffer.returns(expectedRequest);

        });

        it('creates two sockets and bind them to remote', function() {
            this.driver.connect();
            expect(dgram.createSocket).calledTwice;
        });

        it('binds sockets to given local address', function() {
            var driver = this.driver;

            driver.connect();

            expect(driver._dataSocket.bind).to.be.calledWith(null, "192.168.0.92");
            expect(driver._dataSocket.bind).to.be.calledWith(null, "192.168.0.92");
        });

        it('binds socket to matching iface if no local address was provided', function() {
            var expectedAddress = "10.0.1.123",
                driver = new KnxIpDriver({remoteAddress: "10.0.1.10"});

            sandbox.stub(require('os'), 'networkInterfaces').returns({
                lo0: [
                    { address: '::1', mask: 'ffff:ffff:ffff:ffff:0:0:0', family: 'IPv6', internal: true },
                    { address: 'fe80::1', mask: 'ffff:ffff:ffff:ffff:0:0:0', family: 'IPv6', internal: true },
                    { address: '127.0.0.1', mask: '255.255.255.0', family: 'IPv4', internal: true }
                ],
                en1: [
                    { address: 'fe80::cabc:c8ff:feef:f996', family: 'IPv6', internal: false },
                    { address: "10.0.5.123", family: 'IPv4', internal: false },
                    { address: expectedAddress, family: 'IPv4', internal: false }
                ]
            });

            driver.connect();

            expect(driver._dataSocket.bind).to.be.calledWith(null, expectedAddress);
            expect(driver._dataSocket.bind).to.be.calledWith(null, expectedAddress);
        });

        it('uses subnet mask of local interfaces if provided (>= node 0.11.2)', function() {
            var expectedAddress = "10.0.5.123",
                driver = new KnxIpDriver({remoteAddress: "10.0.1.10"});

            sandbox.stub(require('os'), 'networkInterfaces').returns({
                lo0: [
                    { address: '::1', family: 'IPv6', internal: true },
                    { address: 'fe80::1', family: 'IPv6', internal: true },
                    { address: '127.0.0.1', family: 'IPv4', internal: true }
                ],
                en1: [
                    { address: 'fe80::cabc:c8ff:feef:f996', mask: 'ffff:ffff:ffff:ffff:0:0:0', family: 'IPv6', internal: false },
                    { address: expectedAddress, mask: '255.255.0.0', family: 'IPv4', internal: false },
                    { address: "10.2.0.1", mask: '255.255.255.241', family: 'IPv4', internal: false }
                ]
            });

            driver.connect();

            expect(driver._dataSocket.bind).to.be.calledWith(null, expectedAddress);
            expect(driver._dataSocket.bind).to.be.calledWith(null, expectedAddress);
        });

        it('throws error if no matching address is found', function() {
            var driver = new KnxIpDriver({remoteAddress: "10.0.1.10"});

            sandbox.stub(require('os'), 'networkInterfaces').returns({
                en1: [
                    { address: "10.2.0.1", mask: '255.255.255.0', family: 'IPv4', internal: false }
                ]
            });

            expect(function() {
                driver.connect();
            }).to.Throw(Error);
        });

        it('listen to messages on sockets an triggers packet event', function() {
            var eventSpy = sinon.spy(),
                packetStub = sinon.createStubInstance(KnxIp.Packet),
                buffer = new Buffer([1, 4, 9]);

            sandbox.stub(KnxIp.Packet, 'factory').returns(packetStub);

            this.driver.on('packet', eventSpy);
            this.driver.connect();

            this.driver._dataSocket.emit('message', buffer);
            expect(eventSpy).to.be.calledOnce;

            this.driver._connectionSocket.emit('message', buffer);
            expect(eventSpy).to.be.calledTwice;

            expect(eventSpy).to.be.calledWith(packetStub);
        });

        it('sends connection request with correct endpoints', function() {
            var driver = this.driver,
                expected;

            expected = new KnxIp.ConnectionRequest(
                new KnxIp.Hpai("192.168.0.92", 5001),
                new KnxIp.Hpai("192.168.0.92", 5002)
            );

            driver.connect();

            expect(driver._dataSocket.send).never;
            expect(driver._connectionSocket.send).calledOnce;
            expect(driver._connectionSocket).to.have.sent(expected);
        });

        it('waits for connection response and connectionstate response once', function() {

            var driver = this.driver,
                channelId = 96,
                status = 0,
                endpoint = new KnxIp.Hpai("192.168.0.10", 1234),
                connectionResponse = new KnxIp.ConnectionResponse(channelId, status, endpoint),
                connectedSpy = sandbox.spy();

            driver.on('connected', connectedSpy);

            driver.connect();
            expect(connectedSpy).not.to.be.called;
            expect(driver.isConnected()).to.be.false;

            driver.emit('packet', connectionResponse);
            driver.emit('packet', connectionResponse); // This should not cause a second call

            expect(driver._channelId).to.be.equal(channelId, "Channel id stored");
            expect(connectedSpy).to.be.calledOnce;
            expect(driver.isConnected()).to.be.true;
        });

        it('repeats connection request if no response is received within 1 second', function() {
            var driver = this.driver,
                clock = sinon.useFakeTimers(),
                expected;

            expected = new KnxIp.ConnectionRequest(
                new KnxIp.Hpai("192.168.0.92", 5001),
                new KnxIp.Hpai("192.168.0.92", 5002)
            );

            driver.connect();

            expect(driver._dataSocket.send).never;
            expect(driver._connectionSocket.send).calledOnce;

            clock.tick(999);
            expect(driver._connectionSocket.send).calledOnce;

            clock.tick(1);
            expect(driver._dataSocket.send).never;
            expect(driver._connectionSocket.send).calledTwice;

            expect(driver._connectionSocket).to.have.sent(expected);

            clock.restore();
        });

        it('does not trigger tunnel request on other messages', function() {
            var driver = this.driver,
                unexpectedPacket = sinon.createStubInstance(KnxIp.TunnelingRequest),
                expectedPacket  = sinon.createStubInstance(KnxIp.ConnectionResponse),
                connectedSpy     = sandbox.spy();

            unexpectedPacket.getServiceName.returns('tunneling.request');
            expectedPacket.getServiceName.returns('connection.response');
            expectedPacket.getChannelId.returns(33);

            driver.on('connected', connectedSpy);

            driver.connect();

            driver.emit('packet', unexpectedPacket);
            expect(connectedSpy).not.to.be.called;

            driver.emit('packet', expectedPacket);
            expect(connectedSpy).to.be.calledOnce;
        });

        it('does not make simultaneous connect requests', function() {
            var driver = this.driver;

            driver.connect();
            driver.connect();

            expect(dgram.createSocket).to.be.calledTwice;
            expect(driver._connectionSocket.send).to.be.calledOnce;
            expect(driver._dataSocket.send).not.to.be.called;
        });

        it('triggers callback after connection was established', function() {
            var driver   = this.driver,
                response = sinon.createStubInstance(KnxIp.ConnectionResponse),
                callback = sandbox.spy();

            response.getServiceName.returns('connection.response');
            response.getChannelId.returns(33);

            driver.connect(callback);

            expect(callback).not.to.be.called;

            driver.emit('packet', response);

            expect(callback).to.be.calledOnce;
        });

        it('triggers callbacks of multiple connect() calls', function() {
            var driver   = this.driver,
                response = sinon.createStubInstance(KnxIp.ConnectionResponse),
                callbackA = sandbox.spy(),
                callbackB = sandbox.spy();

            response.getServiceName.returns('connection.response');
            response.getChannelId.returns(33);

            driver.connect(callbackA);
            driver.connect(callbackB);

            expect(callbackA).not.to.be.called;
            expect(callbackB).not.to.be.called;

            driver.emit('packet', response);

            expect(callbackA).to.be.calledOnce;
            expect(callbackB).to.be.calledOnce;
        });

    });

    describe('heartbeat', function() {

        it.skip('sends first connection state request immediately after connect', function() {
            var driver = this.driver,
                response  = sinon.createStubInstance(KnxIp.ConnectionResponse),
                channelId = 123,
                expected;

            response.getChannelId.returns(channelId);
            response.getServiceName.returns('connection.response');
            expected = new KnxIp.ConnectionStateRequest(channelId, new KnxIp.Hpai("192.168.0.92", 5001));

            driver.connect();
            driver._connectionSocket.send.reset();
            driver.emit('packet', response);

            expect(driver._connectionSocket.send).calledOnce;
            expect(driver._connectionSocket).to.have.sent(expected);
        });

        it('repeats every 60 seconds');

        it('throws error if no status is returned');

    });

    describe('sending messages', function() {

        beforeEach(function() {
            this.destination = sinon.createStubInstance(homelib.GroupAddress);
            this.destination.getRaw.returns([0x08, 0x02]);

            this.message = sinon.createStubInstance(Message);
            this.message.getPriority.returns("normal");
            this.message.isRepeated.returns(false);
            this.message.getRoutingCounter.returns(6);
            this.message.getCommand.returns("write");
            this.message.getData.returns([1]);
            this.message.getDestination.returns(this.destination);
            this.message.getOrigin.returns(null);

            this.cemi = sinon.createStubInstance(KnxIp.Cemi);
            this.cemi.getMessage.returns(this.message);
            this.cemi.toArray.returns([0x11, 0x00, 0xbc, 0xe0, 0x00, 0x00, 0x08, 0x02, 0x01, 0x00, 0x81]);

            var response  = sinon.createStubInstance(KnxIp.ConnectionResponse);
            response.getChannelId.returns(123);
            response.getServiceName.returns('connection.response');

            this.driver.connect();
            this.driver.emit('packet', response);
            this.driver._connectionSocket.send.reset();
        });

        it('throws exception if connection is not open', function() {
            var driver = new KnxIpDriver({
                localAddress: "192.168.0.92",
                remoteAddress: "192.168.0.10"
            });

            expect(function() {
                driver.send(this.message);
            }).to.throw(/not.+connected/);
        });

        it('sends a tunneling request on data port', function() {
            var driver = this.driver,
                expected = new KnxIp.TunnelingRequest(123, 0, this.cemi);

            driver.send(this.message);

            expect(driver._dataSocket).to.have.sent(expected.toBuffer());
        });

        it('repeats tunneling request until tunneling response was received');

        it('calls callback if message was transmitted successfully', function() {
            var driver = this.driver,
                ack = sinon.createStubInstance(KnxIp.TunnelingAck),
                spy = sinon.spy();

            ack.getServiceName.returns('tunneling.ack');

            driver.send(this.message, spy);

            expect(spy).not.to.be.called;
            
            driver.emit('packet', ack);

            expect(spy).to.be.calledOnce.and.calledOn(driver);
        });

    });

    describe('receiving messages', function() {

        beforeEach(function() {
            this.message = sinon.createStubInstance(Message);

            this.cemi = sinon.createStubInstance(KnxIp.Cemi);
            this.cemi.getMessageCode.returns('L_Data.req');
            this.cemi.getMessage.returns(this.message);
            this.cemi.toArray.returns([0x11, 0x00, 0xbc, 0xe0, 0x11, 0x02, 0x10, 0x00, 0x01, 0x00, 0x81]);

            this.tunnelingRequest = sinon.createStubInstance(KnxIp.TunnelingRequest);
            this.tunnelingRequest.getChannelId.returns(79);
            this.tunnelingRequest.getSequence.returns(49);
            this.tunnelingRequest.getCemi.returns(this.cemi);

            var response  = sinon.createStubInstance(KnxIp.ConnectionResponse);
            response.getChannelId.returns(79);
            response.getServiceName.returns('connection.response');

            this.driver.connect();
            this.driver.emit('packet', response);
            this.driver._connectionSocket.send.reset();
        });

        it('sends tunneling ack to confirm a received message', function() {
            var expected = new KnxIp.TunnelingAck(
                this.tunnelingRequest.getChannelId(),
                this.tunnelingRequest.getSequence()
            );

            this.driver.emit('packet', this.tunnelingRequest);
            expect(this.driver._dataSocket).to.have.sent(expected.toBuffer());
        });

        it('repeats message to confirm that the received data is correct', function() {
            var expected,
                cemi = this.cemi,
                cemiClone = sinon.createStubInstance(KnxIp.Cemi);

            cemiClone.toArray.returns(function() {
                var data = cemi.toArray();
                data[0] = 0x2e; // L_Data.con
                return data;
            }());

            expected = new KnxIp.TunnelingRequest(
                this.tunnelingRequest.getChannelId(),
                this.tunnelingRequest.getSequence(),
                cemiClone
            );

            sandbox.stub(KnxIp.Cemi, "parse").returns(cemiClone);

            this.driver.emit('packet', this.tunnelingRequest);

            expect(KnxIp.Cemi.parse).to.be.calledWith(cemi.toArray());
            expect(this.driver._dataSocket).to.have.sent(expected);
            expect(cemiClone.setMessageCode).to.be.calledOnce.and.calledWith('L_Data.con');
        });

        it('triggers message event', function() {
            var eventSpy = sinon.spy();

            var ack = new KnxIp.TunnelingAck(
                this.tunnelingRequest.getChannelId(),
                this.tunnelingRequest.getSequence()
            );

            this.driver.on('message', eventSpy);
            this.driver.emit('packet', this.tunnelingRequest);
            this.driver.emit('packet', ack);

            expect(eventSpy).to.be.calledOnce.and.to.be.calledWith(this.message);
        });

        it('does not trigger message event on repeated messages', function() {
            var eventSpy = sinon.spy();

            this.message.isRepeated.returns(true);

            this.driver.on('message', eventSpy);
            this.driver.emit('packet', this.tunnelingRequest);

            expect(eventSpy).not.to.be.called;
        });
    });

    describe('receiving disconnect from remote', function() {

        beforeEach(function() {

            this.disconnectRequest = sinon.createStubInstance(KnxIp.DisconnectRequest);
            this.disconnectRequest.getChannelId.returns(79);

            var response  = sinon.createStubInstance(KnxIp.ConnectionResponse);
            response.getChannelId.returns(79);
            response.getServiceName.returns('connection.response');

            this.driver.connect();
            this.driver.emit('packet', response);
            this.driver._connectionSocket.send.reset();
        });

        it('sends disconnect response', function() {

            var expected = new KnxIp.DisconnectResponse(
                this.tunnelingRequest.getChannelId(),
                0 // status
            );

            this.driver.emit('packet', this.disconnectRequest);
            expect(this.driver._connectionSocket).to.have.sent(expected.toBuffer());
        });

        it('triggers diconnect event on driver', function() {
            var spy = sinon.spy();
            this.driver.on('disconnect', spy);

            this.driver.emit('packet', this.disconnectRequest);

            expect(spy).to.be.calledOnce.and.calledWith(this.disconnectRequest);
        });

        it('sets driver status to not connected', function() {
            expect(this.driver.isConnected()).to.be.equal(true);
            this.driver.emit('packet', this.disconnectRequest);
            expect(this.driver.isConnected()).not.to.be.equal(true);
        });
    });

    describe('initiating a disconnect', function() {

        beforeEach(function() {
            this.channelId = 79;
            var response  = sinon.createStubInstance(KnxIp.ConnectionResponse);
            response.getChannelId.returns(this.channelId);
            response.getServiceName.returns('connection.response');

            this.driver.connect();
            this.driver.emit('packet', response);
            this.driver._connectionSocket.send.reset();
        });

        it('sends disconnect request', function() {
            var socket = this.driver._connectionSocket,
                expected = new KnxIp.DisconnectRequest(
                    new KnxIp.Hpai(socket.address().address, socket.address().port),
                    this.channelId
                );

            this.driver.disconnect();

            expect(this.driver._connectionSocket).to.have.sent(expected.toBuffer());
        });

        it('repeats disconnect request until response was received', function() {
            var driver = this.driver,
                clock = sinon.useFakeTimers(),
                response = sinon.createStubInstance(KnxIp.DisconnectResponse);

            response.getServiceName.returns('disconnect.response');

            driver.disconnect();

            expect(driver._dataSocket.send).never;
            expect(driver._connectionSocket.send).calledOnce;

            clock.tick(999);
            expect(driver._connectionSocket.send).calledOnce;

            clock.tick(1);
            expect(driver._dataSocket.send).never;
            expect(driver._connectionSocket.send).calledTwice;

            clock.tick(1000);
            expect(driver._dataSocket.send).never;
            expect(driver._connectionSocket.send).to.be.calledThrice;

            driver.emit('packet', response);

            clock.tick(1000);
            expect(driver._dataSocket.send).never;
            expect(driver._connectionSocket.send).to.be.calledThrice;

            clock.restore();
        });

        it('sets driver status to not connected', function() {
            var response = sinon.createStubInstance(KnxIp.DisconnectResponse);

            response.getServiceName.returns('disconnect.response');

            expect(this.driver.isConnected()).to.be.equal(true);

            this.driver.disconnect();
            this.driver.emit('packet', response);

            expect(this.driver.isConnected()).not.to.be.equal(true);
        });

    });

});