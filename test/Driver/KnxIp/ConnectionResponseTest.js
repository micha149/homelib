var chai = require('chai'),
    expect = chai.expect,
    sinon  = require('sinon'),
    Buffer = require('buffer').Buffer,
    homelib = require('../../../homelib'),
    KnxIp  = homelib.Driver.KnxIp;

describe("ConnectionResponse", function() {

    beforeEach(function() {
        this.channelId = 73;
        this.status = 0;
        this.endpoint = new KnxIp.Hpai("192.168.10.14", 3671);
        this.response = new KnxIp.ConnectionResponse(this.channelId, this.status, this.endpoint);
    });

    it('extends KnxIp.Packet', function() {
        expect(this.response).to.be.instanceOf(KnxIp.Packet);
    });

    it('returns channel id', function() {
        var response = this.response;
        expect(response.getChannelId()).to.be.equal(this.channelId);
    });

    it('returns endpoint', function() {
        var response = this.response;
        expect(response.getEndpoint()).to.be.equal(this.endpoint);
    });

    it('returns status', function() {
        var response = this.response;
        expect(response.getStatus()).to.be.equal(this.status);
    });

    it('parse sets correct values', function() {
        var buffer = new Buffer([0x06, 0x10, 0x02, 0x06, 0x00, 0x14, 0x49, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x0a, 0x0e, 0x0e, 0x57, 0x04, 0x04, 0x10, 0x01]),
            response = KnxIp.ConnectionResponse.parse(buffer),
            expectedHpai = this.endpoint;

        expect(response.getChannelId()).to.be.equal(73);
        expect(response.getStatus()).to.be.equal(0);
        expect(response.getEndpoint()).to.be.deep.equal(expectedHpai);
    });

    it('generates correct buffer', function() {
        var buffer = this.response.toBuffer(),
            expected = [0x06, 0x10, 0x02, 0x06, 0x00, 0x14, 0x49, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x0a, 0x0e, 0x0e, 0x57, 0x04, 0x04, 0x10, 0x01];

        expect(buffer.toJSON()).to.have.bytes(expected);
    });
});