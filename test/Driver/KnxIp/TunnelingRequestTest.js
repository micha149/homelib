var assert = require('assert'),
    sinon  = require('sinon'),
    homelib = require('../../../homelib'),
    Buffer = require('buffer').Buffer,
    KnxIp  = homelib.Driver.KnxIp,
    Message = homelib.Message;

describe("TunnelingRequest", function() {

    describe("constructor", function() {

        it('extends KnxIp.Packet', function() {
            var msg = sinon.createStubInstance(Message),
                req = new KnxIp.TunnelingRequest(1, 2, msg);
            assert.ok(req instanceof KnxIp.Packet, "expected instance");
        });

        it ('sets object properties', function() {
            var channelId = 94,
                sequence = 211,
                message = sinon.createStubInstance(Message),
                req = new KnxIp.TunnelingRequest(channelId, sequence, message);

            assert.equal(req._channelId, channelId);
            assert.equal(req._sequence, sequence);
            assert.equal(req._message, message);
        });
    });

    describe('.toBuffer()', function() {
        it('returns a buffer with the correct bytes', function() {
            var channelId = 94,
                sequence = 211,
                message = sinon.createStubInstance(Message),
                expected = new Buffer([0x06, 0x10, 0x04, 0x20, 0x00, 0x0d, 0x04, channelId, sequence, 0x00, 0x01, 0x02, 0x03]),
                request = new KnxIp.TunnelingRequest(channelId, sequence, message);

            message.toArray.returns([0x01, 0x02, 0x03]);

            assert.deepEqual(request.toBuffer(), expected);
        });
    });

    describe('.getServiceType()', function() {
        it('returns correct service type', function() {
            var message = new Message(),
                request = new KnxIp.TunnelingRequest(1, 2, message);
            assert.equal(request.getServiceType(), 0x0420);
        });
    });

    describe('.getChannelId()', function() {
        it('returns correct channel id', function() {
            var message = new Message(),
                channelId = 2,
                sequence = 128,
                request = new KnxIp.TunnelingRequest(channelId, sequence, message);

            assert.equal(request.getChannelId(), channelId);
        });
    });

    describe('.getSequence()', function() {
        it('returns correct sequence', function() {
            var message = new Message(),
                channelId = 2,
                sequence = 128,
                request = new KnxIp.TunnelingRequest(channelId, sequence, message);

            assert.equal(request.getSequence(), sequence);
        });
    });

    describe('.getMessage()', function() {
        it('returns correct message', function() {
            var message = new Message(),
                channelId = 2,
                sequence = 128,
                request = new KnxIp.TunnelingRequest(channelId, sequence, message);

            assert.strictEqual(request.getMessage(), message);
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
    })

    it('returns instance for given buffer', function() {
        var message = new Message(),
            channelId = 2,
            sequence = 128,
            buffer = new Buffer([0x06, 0x10, 0x04, 0x21, 0x00, 0x0a, 0x04, channelId, sequence, 0x00, 0x29, 0x01, 0x99, 0x01, 0x02, 0x03])
            expected = new KnxIp.TunnelingRequest(channelId, sequence, message);

        sandbox.stub(Message, 'parse').returns(message);

        assert.deepEqual(KnxIp.TunnelingRequest.parse(buffer), expected);
        assert.ok(Message.parse.calledOnce, "parse() on Message called");
        assert.deepEqual(Message.parse.firstCall.args[0], new Buffer([1, 2, 3]));
    });
});