var chai = require('chai'),
    expect = chai.expect,
    sinon  = require('sinon'),
    Buffer = require('buffer').Buffer,
    homelib = require('../../../homelib'),
    KnxIp  = homelib.Driver.KnxIp;

describe("ConnectionStateResponse", function() {

    beforeEach(function() {
        this.channelId = 73;
        this.status = 0;
        this.response = new KnxIp.ConnectionStateResponse(this.channelId, this.status);
    });

    it('extends KnxIp.Packet', function() {
        expect(this.response).to.be.instanceOf(KnxIp.Packet);
    });

    it('returns channel id', function() {
        var response = this.response;
        expect(response.getChannelId()).to.be.equal(this.channelId);
    });

    it('returns status', function() {
        var response = this.response;
        expect(response.getStatus()).to.be.equal(this.status);
    });

    it('parse sets correct values', function() {
        var buffer = new Buffer([0x06, 0x10, 0x02, 0x08, 0x00, 0x08, 0x49, 0x00]),
            response = KnxIp.DisconnectResponse.parse(buffer);

        expect(response.getChannelId()).to.be.equal(0x49);
        expect(response.getStatus()).to.be.equal(0x00);
    });

    it('generates correct buffer', function() {
        var buffer = this.response.toBuffer(),
            expected = [0x06, 0x10, 0x02, 0x08, 0x00, 0x08, 0x49, 0x00];

        expect(buffer.toJSON()).to.have.bytes(expected);
    });
});