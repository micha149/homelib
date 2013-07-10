var assert = require('assert'),
    sinon  = require('sinon'),
    homelib = require('../../../homelib'),
    KnxIp  = homelib.Driver.KnxIp;

describe("TunnelingAck", function() {

    describe("constructor", function() {

        it('extends KnxIp.Packet', function() {
            var ack = new KnxIp.TunnelingAck(1, 2);
            assert.ok(ack instanceof KnxIp.Packet, "expected instance");
        });

        it ('sets object properties', function() {
            var channelId = 94,
                sequence = 211,
                status = 0x02,
                ack = new KnxIp.TunnelingAck(channelId, sequence, status);

            assert.equal(ack._data[1], channelId);
            assert.equal(ack._data[2], sequence);
            assert.equal(ack._data[3], status);
        });
    });

    describe('.toBuffer()', function() {
        it('returns a buffer with the correct bytes', function() {
            var channelId = 94,
                sequence = 211,
                status = 0x02,
                expected = new Buffer([0x06, 0x10, 0x04, 0x21, 0x00, 0x0a, 0x04, channelId, sequence, status]),
                ack = new KnxIp.TunnelingAck(channelId, sequence, status);

            assert.deepEqual(ack.toBuffer(), expected);
        });
    });

    describe('.getServiceType()', function() {
        it('returns correct service type', function() {
            var ack = new KnxIp.TunnelingAck(1, 2);
            assert.equal(ack.getServiceType(), 0x0421);
        });
    });

});

describe("TunnelingAck.parse", function() {
    it('returns TunnelingAck instance for given buffer', function() {
        var channelId = 94,
            sequence = 211,
            status = 0x02,
            buffer = new Buffer([0x06, 0x10, 0x04, 0x21, 0x00, 0x0a, 0x04, channelId, sequence, status]),
            expected = new KnxIp.TunnelingAck(channelId, sequence, status);

        assert.deepEqual(KnxIp.TunnelingAck.parse(buffer), expected);
    });
});