var expect = require('chai').expect,
    sinon  = require('sinon'),
    buffer = require('buffer'),
    homelib = require('../../../homelib'),
    KnxIp  = homelib.Driver.KnxIp;

describe("DisconnectRequest", function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();

        this.endpoint = sinon.createStubInstance(KnxIp.Hpai);
        this.endpoint.toArray.returns([0x08, 0x01, 0xc0, 0xa8, 0x0a, 0xb3, 0xd9, 0x6d]);

        this.chanelId = 21;

        this.request = new KnxIp.DisconnectRequest(this.endpoint, this.chanelId);
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe("constructor", function() {

        it('extends KnxIp.Packet', function() {
            var endpoint = this.endpoint,
                req = this.request;

            expect(req).to.be.instanceOf(KnxIp.Packet);
        });

    });

    describe('getting packet bytes', function() {

        it('returns buffer with correct header bytes', function() {
            var buf,
                endpoint = this.endpoint,
                req    = this.request,
                expected = new Buffer([0x06, 0x10, 0x02, 0x09, 0x00, 0x10]);

            buf = req.toBuffer();

            expect(buf.slice(0,6)).to.be.deep.equal(expected);
        });

        it('includes correct chanelId', function() {
            var buf,
                chanelId = this.chanelId,
                req = this.request;

            buf = req.toBuffer();

            expect(buf[6]).to.be.equal(chanelId);
        });

        it('includes correct endpoint bytes', function() {
            var buf,
                endpoint = this.endpoint,
                req = this.request;

            buf = req.toBuffer();

            expect(buf.slice(8, 16)).to.have.bytes(endpoint.toArray());
        });

    });

    describe('parsing buffer', function() {

        it('creates request with correct channel id', function() {
            var buf = new buffer.Buffer([0x06, 0x10, 0x02, 0x09, 0x00, 0x10, 0x07, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x01, 0x0b, 0x0e, 0x57]),
                req = KnxIp.DisconnectRequest.parse(buf);

            expect(req.getChannelId()).to.be.equal(7);
        });

        it('uses Hpai.parse() to create correct HPAI instance', function() {
            var buf = new buffer.Buffer([0x06, 0x10, 0x02, 0x09, 0x00, 0x10, 0x07, 0x00, 0x08, 0x01, 0xc0, 0xa8, 0x01, 0x0b, 0x0e, 0x57]),
                expectedHpai = sinon.createStubInstance(KnxIp.Hpai),
                req;

            sandbox.stub(KnxIp.Hpai, 'parse').returns(expectedHpai);

            req = KnxIp.DisconnectRequest.parse(buf);

            expect(req.getEndpoint()).to.be.deep.equal(expectedHpai);
            expect(KnxIp.Hpai.parse).to.be.calledWith(buf.slice(8, 16));
        });
    });

});