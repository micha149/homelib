var assert = require('assert'),
    sinon  = require('sinon'),
    homelib = require('../../../homelib'),
    KnxIp  = homelib.Driver.KnxIp;

describe("ConnectionRequest", function() {

    describe("constructor", function() {
        it ('sets object properties', function() {
            var client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            assert.equal(req.client, client, "Client stored");
            assert.equal(req.server, server, "Server stored");
            assert.deepEqual(req.data, [0x04, 0x04, 0x02, 0x00], "CRI data stored");
        });
    });

    describe('.toBuffer()', function() {

        it('returns buffer with correct header bytes', function() {
            var buf,
                client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            client.toBuffer.returns(new Buffer(8));
            server.toBuffer.returns(new Buffer(8));

            buf = req.toBuffer();

            assert.equal(buf[0], 0x06, "Correct header size");
            assert.equal(buf[1], 0x10, "Correct protocol version (1.0)");
            assert.equal(buf[2], 0x02, "Correct request type octet 1");
            assert.equal(buf[3], 0x05, "Correct request type octet 2");
            assert.equal(buf[4], 0x00, "Correct length octet 1");
            assert.equal(buf[5], 0x1a, "Correct length octet 2");
        });

        it('returns buffer with correct client hpai', function() {
            var buf,
                expectedClientBuffer = new Buffer([1,2,3,4,5,6,7,8]),
                client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            client.toBuffer.returns(expectedClientBuffer);
            server.toBuffer.returns(new Buffer(8));

            buf = req.toBuffer();

            assert.deepEqual(buf.slice(6, 14), expectedClientBuffer);
        });

        it('returns buffer with correct server hpai', function() {
            var buf,
                expectedServerBuffer = new Buffer([1,2,3,4,5,6,7,8]),
                client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            client.toBuffer.returns(new Buffer(8));
            server.toBuffer.returns(expectedServerBuffer);

            buf = req.toBuffer();

            assert.deepEqual(buf.slice(14, 22), expectedServerBuffer);
        });

        it('returns buffer with correct cri bytes', function() {
            var buf,
                expectedCriBuffer = new Buffer([0x04,0x04,0x02,0x00]),
                client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            client.toBuffer.returns(new Buffer(8));
            server.toBuffer.returns(new Buffer(8));

            buf = req.toBuffer();

            assert.deepEqual(buf.slice(22, 26), expectedCriBuffer);
        });

    });

});