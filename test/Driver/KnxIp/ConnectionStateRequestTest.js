var chai = require('chai'),
    expect = chai.expect,
    sinon  = require('sinon'),
    Buffer = require('buffer').Buffer,
    homelib = require('../../../homelib'),
    KnxIp  = homelib.Driver.KnxIp;

describe("ConnectionStateRequest", function() {

    beforeEach(function() {
        this.channelId = 73;
        this.endpoint = new KnxIp.Hpai("192.168.10.179", 55661);
        this.request = new KnxIp.ConnectionStateRequest(this.channelId, this.endpoint);
    });

    it('extends KnxIp.Packet', function() {
        expect(this.request).to.be.instanceOf(KnxIp.Packet);
    });

    it('returns channel id', function() {
        var request = this.request;
        expect(request.getChannelId()).to.be.equal(this.channelId);
    });

    it('returns endpoint', function() {
        var request = this.request;
        expect(request.getEndpoint()).to.be.equal(this.endpoint);
    });

    it('parse sets correct values', function() {
        var buffer = new Buffer([0x06, 0x10, 0x02, 0x07, 0x00, 0x10, 0x49, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x0a, 0xb3, 0xd9, 0x6d]),
            request = KnxIp.ConnectionStateRequest.parse(buffer),
            expectedHpai = this.endpoint;

        expect(request.getChannelId()).to.be.equal(73);
        expect(request.getEndpoint()).to.be.deep.equal(expectedHpai);
    });

    it('generates correct buffer', function() {
        var buffer = this.request.toBuffer(),
            expected = [0x06, 0x10, 0x02, 0x07, 0x00, 0x10, 0x49, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x0a, 0xb3, 0xd9, 0x6d];

        expect(buffer.toJSON()).to.have.bytes(expected);
    });
});