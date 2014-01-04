var assert = require('assert'),
    sinon  = require('sinon'),
    homelib = require('../../../homelib'),
    Buffer = require('buffer').Buffer,
    KnxIp  = homelib.Driver.KnxIp;

describe("TunnelingRequest", function() {

    describe("constructor", function() {

        it('extends KnxIp.Packet', function() {
            var msg = sinon.createStubInstance(KnxIp.Cemi),
                req = new KnxIp.TunnelingRequest(1, 2, msg);
            assert.ok(req instanceof KnxIp.Packet, "expected instance");
        });

        it ('sets object properties', function() {
            var channelId = 94,
                sequence = 211,
                cemi = sinon.createStubInstance(KnxIp.Cemi),
                req = new KnxIp.TunnelingRequest(channelId, sequence, cemi);

            assert.equal(req._channelId, channelId);
            assert.equal(req._sequence, sequence);
            assert.equal(req._cemi, cemi);
        });
    });

    describe('.toBuffer()', function() {
        it('returns a buffer with the correct bytes', function() {
            var channelId = 94,
                sequence = 211,
                cemi = sinon.createStubInstance(KnxIp.Cemi),
                expected = new Buffer([0x06, 0x10, 0x04, 0x20, 0x00, 0x0f, 0x04, channelId, sequence, 0x00, 0x11, 0x00, 0x01, 0x02, 0x03]),
                request = new KnxIp.TunnelingRequest(channelId, sequence, cemi);

            cemi.toArray.returns([0x11, 0x00, 0x01, 0x02, 0x03]);

            assert.deepEqual(request.toBuffer(), expected);
        });
    });

    describe('.getServiceType()', function() {
        it('returns correct service type', function() {
            var cemi = sinon.createStubInstance(KnxIp.Cemi),
                request = new KnxIp.TunnelingRequest(1, 2, cemi);
            assert.equal(request.getServiceType(), 0x0420);
        });
    });

    describe('.getChannelId()', function() {
        it('returns correct channel id', function() {
            var cemi = sinon.createStubInstance(KnxIp.Cemi),
                channelId = 2,
                sequence = 128,
                request = new KnxIp.TunnelingRequest(channelId, sequence, cemi);

            assert.equal(request.getChannelId(), channelId);
        });
    });

    describe('.getSequence()', function() {
        it('returns correct sequence', function() {
            var cemi = sinon.createStubInstance(KnxIp.Cemi),
                channelId = 2,
                sequence = 128,
                request = new KnxIp.TunnelingRequest(channelId, sequence, cemi);

            assert.equal(request.getSequence(), sequence);
        });
    });

    describe('.getCemi()', function() {
        it('returns correct cemi', function() {
            var cemi = sinon.createStubInstance(KnxIp.Cemi),
                channelId = 2,
                sequence = 128,
                request = new KnxIp.TunnelingRequest(channelId, sequence, cemi);

            assert.strictEqual(request.getCemi(), cemi);
        });
    });

});

describe("TunnelingRequest.parse", function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('returns instance for given buffer', function() {
        var cemi = sinon.createStubInstance(KnxIp.Cemi),
            channelId = 2,
            sequence = 128,
            buffer = new Buffer([0x06, 0x10, 0x04, 0x21, 0x00, 0x0a, 0x04, channelId, sequence, 0x00, 0x2e, 0x00, 0x01, 0x02, 0x03]),
            expected = new KnxIp.TunnelingRequest(channelId, sequence, cemi);

        sandbox.stub(KnxIp.Cemi, 'parse').returns(cemi);

        assert.deepEqual(KnxIp.TunnelingRequest.parse(buffer), expected);
        assert.ok(KnxIp.Cemi.parse.calledOnce, "parse() on KnxIp.Cemi called");
        assert.deepEqual(KnxIp.Cemi.parse.firstCall.args[0], new Buffer([0x2e, 0x00, 0x01, 0x02, 0x03]));
    });
});