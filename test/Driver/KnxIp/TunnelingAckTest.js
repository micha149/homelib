var expect = require('chai').expect,
    sinon  = require('sinon'),
    homelib = require('../../../homelib'),
    KnxIp  = homelib.Driver.KnxIp;

describe("TunnelingAck", function() {

    beforeEach(function() {
        this.channelId = 94;
        this.sequence = 211;
        this.status = 0x02;
    });

    it('extends KnxIp.Packet', function() {
        var ack = new KnxIp.TunnelingAck(1, 2);
        expect(ack).to.be.instanceOf(KnxIp.Packet);
    });

    it('stores channelId', function() {
        var ack = new KnxIp.TunnelingAck(this.channelId, this.sequence, this.status);
        expect(ack.getChannelId()).to.be.equal(this.channelId);
    });

    it('stores sequence number', function() {
        var ack = new KnxIp.TunnelingAck(this.channelId, this.sequence, this.status);
        expect(ack.getSequence()).to.be.equal(this.sequence);
    });

    it('stores status', function() {
        var ack = new KnxIp.TunnelingAck(this.channelId, this.sequence, this.status);
        expect(ack.getStatus()).to.be.equal(this.status);
    });

    it('returns a buffer with the correct bytes', function() {
        var ack = new KnxIp.TunnelingAck(this.channelId, this.sequence, this.status);
        expect(ack.toBuffer()).to.have.bytes([0x06, 0x10, 0x04, 0x21, 0x00, 0x0a, 0x04, this.channelId, this.sequence, this.status]);
    });

    it('returns correct service type', function() {
        var ack = new KnxIp.TunnelingAck(1, 2);
        expect(ack.getServiceType()).to.be.equal(0x0421);
    });

    describe(".parse()", function() {

        it('returns TunnelingAck instance for given buffer', function() {
            var buffer = new Buffer([0x06, 0x10, 0x04, 0x21, 0x00, 0x0a, 0x04, this.channelId, this.sequence, this.status]),
                expected = new KnxIp.TunnelingAck(this.channelId, this.sequence, this.status);

            expect(KnxIp.TunnelingAck.parse(buffer)).to.be.deep.equal(expected);
        });

    });
});