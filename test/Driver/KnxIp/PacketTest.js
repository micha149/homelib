var assert  = require('assert'),
    sinon   = require('sinon'),
    homelib = require('../../../homelib'),
    Buffer  = require('buffer').Buffer,
    KnxIp   = homelib.Driver.KnxIp;

describe('Packet', function() {

    describe('constructor', function() {

        it('creates new instance by given service type and data', function() {
            var expectedServiceType = 0x0421,
                expectedData = [0x6d, 0x69, 0x63, 0x68, 0x61, 0x31, 0x34, 0x39],
                packet = new KnxIp.Packet(expectedServiceType, expectedData);

            assert.equal(packet._serviceType, expectedServiceType, "Service type stored");
            assert.equal(packet._data, expectedData, "Data stored");
        });

        it('translates a given string to service type', function() {
            var expectedServiceType = 0x0420,
                serviceName = "tunneling.request",
                packet = new KnxIp.Packet(serviceName);

            assert.equal(packet.getServiceType(), expectedServiceType);
        });

        it('trows exception on unknown service name', function() {
            assert.throws(function() {
                var packet = new KnxIp.Packet('stupid.string');
            });
        });
    });

    describe('toBuffer()', function() {

        it('returns correct buffer for given data', function() {
            var expectedServiceType = 0x0421,
                expectedData = [0x6d, 0x69, 0x63, 0x68, 0x61, 0x31, 0x34, 0x39],
                packet = new KnxIp.Packet(expectedServiceType, expectedData),
                buffer = packet.toBuffer();

            assert.equal(buffer[0], 0x06, "Header length is correct");
            assert.equal(buffer[1], 0x10, "Protocol version is correct");
            assert.equal(((buffer[2] << 8) | buffer[3]), expectedServiceType, "ServiceType is correct");
            assert.equal(((buffer[4] << 8) | buffer[5]), 14, "Total length is correct");
            assert.deepEqual(buffer.toJSON().slice(6), expectedData, "Contains expected data");
        });
    });

    describe('inspect()', function() {

        it('returns string representation for packet', function() {
            var expectedServiceType = 0x0421,
                expectedData = [0x6d, 0x69, 0x63, 0x68, 0x61, 0x31, 0x34, 0x39],
                packet = new KnxIp.Packet(expectedServiceType, expectedData),
                str = packet.inspect();

            assert.equal(str, '<KnxIpPacket (tunneling.ack) 6d 69 63 68 61 31 34 39>');
        });
    });

    describe('getServiceType()', function() {

        it('returns stored service type', function() {
            var packet = new KnxIp.Packet(0x0420, []);
            assert.equal(packet.getServiceType(), 0x420);
        });
    });

    describe('getServiceName()', function() {

        it('returns a human readable string for known services', function() {
            var packet = new KnxIp.Packet(0x0420, []);
            assert.equal(packet.getServiceName(), 'tunneling.request');
        });

        it('returns a formatted hex string for unknown services', function() {
            var packet = new KnxIp.Packet(0x0149, []);
            assert.equal(packet.getServiceName(), '0x0149');
        });
    });

    describe('getData()', function() {

        it('returns stored data array', function() {
            var expectedData = [0x6d, 0x69, 0x63, 0x68, 0x61, 0x31, 0x34, 0x39],
                packet = new KnxIp.Packet(0x0421, expectedData);

            assert.deepEqual(packet.getData(), expectedData);
        });
    });
});

describe('Packet.parse()', function() {

    it('returns packet instance by given array', function() {
        var expectedServiceType = 0x0421,
            expectedData = [0x6d, 0x69, 0x63, 0x68, 0x61, 0x31, 0x34, 0x39],
            header = new Array(6),
            packet;

        header[0] = 0x06;
        header[1] = 0x10;
        header[2] = ((expectedServiceType >> 8) & 0xff);
        header[3] = (expectedServiceType & 0xff);
        header[4] = 0;
        header[5] = 14;

        packet = new KnxIp.Packet.parse(header.concat(expectedData));
        assert.equal(packet._serviceType, expectedServiceType, "Service type stored");
        assert.deepEqual(packet._data, expectedData, "Data stored");
    });

    it('returns packet instance by given buffer', function() {
        var expectedServiceType = 0x0421,
            expectedData = [0x6d, 0x69, 0x63, 0x68, 0x61, 0x31, 0x34, 0x39],
            buffer = new Buffer(14),
            packet;

        buffer[0] = 0x06;
        buffer[1] = 0x10;
        buffer[2] = ((expectedServiceType >> 8) & 0xff);
        buffer[3] = (expectedServiceType & 0xff);
        buffer[4] = 0;
        buffer[5] = 14;

        new Buffer(expectedData).copy(buffer, 6);

        packet = new KnxIp.Packet.parse(buffer);
        assert.ok(packet instanceof KnxIp.Packet, "Instance of KnxIp.Packet returned");
        assert.equal(packet._serviceType, expectedServiceType, "Service type stored");
        assert.deepEqual(packet._data, expectedData, "Data stored");
    });

    it('throws an error if header length is not correct', function() {
        assert.throws(function() {
            var packet = KnxIp.Packet.parse([0x05, 0x10, 0x00, 0x00, 0x00, 0x07, 0x01]);
        });
    });

    it('throws an error if protocol version is not supported', function() {
        assert.throws(function() {
            var packet = KnxIp.Packet.parse([0x06, 0x11, 0x00, 0x00, 0x00, 0x07, 0x01]);
        });
    });

    it('throws an error if total length is not correct', function() {
        assert.throws(function() {
            var packet = KnxIp.Packet.parse([0x06, 0x10, 0x00, 0x00, 0x00, 0x08, 0x01]);
        });
    });
});

describe('Packet.factory', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('calls TunnelingRequest\'s parse method on buffer with 0x0420', function() {
        var stub = sandbox.stub(KnxIp.TunnelingRequest, "parse"),
            buffer = new Buffer([0x06, 0x10, 0x04, 0x20, 0x01, 0x02, 0x03, 0x04]);

        KnxIp.Packet.factory(buffer);

        assert.ok(stub.calledOnce, "parse on TunnelingRequest called");
        assert.ok(stub.calledWith(buffer), "passed buffer to parse method");
    });

    it('calls TunnelingAck\'s parse method on buffer with 0x0421', function() {
        var stub = sandbox.stub(KnxIp.TunnelingAck, "parse"),
            buffer = new Buffer([0x06, 0x10, 0x04, 0x21, 0x01, 0x02, 0x03, 0x04]);

        KnxIp.Packet.factory(buffer);

        assert.ok(stub.calledOnce, "parse on TunnelingRequest called");
        assert.ok(stub.calledWith(buffer), "passed buffer to parse method");
    });

    it('calls ConnectionStateRequest\'s parse method on buffer with 0x0207', function() {
        var stub = sandbox.stub(KnxIp.ConnectionStateRequest, "parse"),
            buffer = new Buffer([0x06, 0x10, 0x02, 0x07, 0x00, 0x10, 0x49, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x0a, 0xb3, 0xd9, 0x6d]);

        KnxIp.Packet.factory(buffer);

        assert.ok(stub.calledOnce, "parse on ConnectionRequests called");
        assert.ok(stub.calledWith(buffer), "passed buffer to parse method");
    });

    it('calls ConnectionStateResponse\'s parse method on buffer with 0x0208', function() {
        var stub = sandbox.stub(KnxIp.ConnectionStateResponse, "parse"),
            buffer = new Buffer([0x06, 0x10, 0x02, 0x08, 0x00, 0x08, 0x49, 0x00]);

        KnxIp.Packet.factory(buffer);

        assert.ok(stub.calledOnce, "parse on ConnectionStateResponse called");
        assert.ok(stub.calledWith(buffer), "passed buffer to parse method");
    });

    it('calls Packet\'s parse method on unknown service types', function() {
        var stub = sandbox.stub(KnxIp.Packet, "parse"),
            buffer = new Buffer([0x06, 0x10, 0x47, 0x11, 0x01, 0x02, 0x03, 0x04]);

        KnxIp.Packet.factory(buffer);

        assert.ok(stub.calledOnce, "parse on Packet called");
        assert.ok(stub.calledWith(buffer), "passed buffer to parse method");
    });

});