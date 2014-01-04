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

        it('throws error if local address is not set', function() {

            function createInstanceWithMissingOption () {
                var driver = new KnxIpDriver({
                    remoteAddress: "192.168.0.10"
                });
            }

            expect(createInstanceWithMissingOption).to.throw(Error, /Missing.*localAddress/);
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

           // sandbox.stub(this.driver, '_createConnectionRequest').returns(connectionRequestStub);
        });

        it('creates two sockets and bind them to remote', function() {
            this.driver.connect();
            expect(dgram.createSocket).calledTwice;
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

});