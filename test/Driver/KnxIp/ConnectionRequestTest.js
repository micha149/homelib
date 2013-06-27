var assert = require('assert'),
    sinon  = require('sinon'),
    homelib = require('../../../homelib'),
    KnxIp  = homelib.Driver.KnxIp;

describe("ConnectionRequest", function() {

    describe("constructor", function() {

        it('extends KnxIp.Packet', function() {
            var client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(1, 2);

            assert.ok(req instanceof KnxIp.Packet, "expected instance");
        });

        it('sets object properties', function() {
            var client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            assert.equal(req._client, client, "Client stored");
            assert.equal(req._server, server, "Server stored");
            assert.deepEqual(req._data, [0x04, 0x04, 0x02, 0x00], "CRI data stored");
        });
    });

    describe('.toBuffer()', function() {

        it('returns buffer with correct header bytes', function() {
            var buf,
                client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server),
                expected = new Buffer([0x06, 0x10, 0x02, 0x05, 0x00, 0x1a]);

            client.toArray.returns([0, 0, 0, 0, 0, 0, 0, 0]);
            server.toArray.returns([0, 0, 0, 0, 0, 0, 0, 0]);

            var buf = req.toBuffer();

            assert.deepEqual(buf.slice(0,6), expected);
        });

        it('returns buffer with correct client hpai', function() {
            var buf,
                expectedClientData = [1,2,3,4,5,6,7,8]
                client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            client.toArray.returns(expectedClientData);
            server.toArray.returns([0, 0, 0, 0, 0, 0, 0, 0]);

            buf = req.toBuffer();

            assert.deepEqual(buf.slice(6, 14), new Buffer(expectedClientData));
        });

        it('returns buffer with correct server hpai', function() {
            var buf,
                expectedServerData = [1,2,3,4,5,6,7,8],
                client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            client.toArray.returns([0, 0, 0, 0, 0, 0, 0, 0]);
            server.toArray.returns(expectedServerData);

            buf = req.toBuffer();

            assert.deepEqual(buf.slice(14, 22), new Buffer(expectedServerData));
        });

        it('returns buffer with correct cri bytes', function() {
            var buf,
                expectedCriBuffer = new Buffer([0x04,0x04,0x02,0x00]),
                client = sinon.createStubInstance(KnxIp.Hpai),
                server = sinon.createStubInstance(KnxIp.Hpai),
                req    = new KnxIp.ConnectionRequest(client, server);

            client.toArray.returns([0, 0, 0, 0, 0, 0, 0, 0]);
            server.toArray.returns([0, 0, 0, 0, 0, 0, 0, 0]);

            buf = req.toBuffer();

            assert.deepEqual(buf.slice(22, 26), expectedCriBuffer);
        });

    });

});