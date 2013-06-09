var assert = require('assert'),
    sinon = require('sinon'),
    KnxIp = require('../../../homelib').Driver.KnxIp,
    Buffer = require('buffer').Buffer;

describe('Hpai', function() {

    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        sandbox.restore();
    })

    describe('constructor', function() {

        beforeEach(function() {
            sandbox.stub(KnxIp.Hpai.prototype, '_assertAddress').returns(true);
        });

        it('stores given address and port', function() {
            var expectedAddress = "192.168.23.45",
                expectedPort = 1234,
                hpai = new KnxIp.Hpai(expectedAddress, expectedPort);

            assert.ok(KnxIp.Hpai.prototype._assertAddress.calledOnce, "address asserted");
            assert.ok(KnxIp.Hpai.prototype._assertAddress.calledWith(expectedAddress), "address passed to assert method");
            assert.equal(hpai.address, expectedAddress, "Address stored");
            assert.equal(hpai.port, expectedPort, "Port stored");
            assert.equal(hpai.protocol, "udp", "Protocol is udp");
        });

        it('throws error if address not matches an ipv4 address', function() {
            KnxIp.Hpai.prototype._assertAddress.returns(false);
            assert.throws(function() {
                var hpai = new KnxIp.Hpai("fooo", 1);
            });
        })

        it('throws error if port is not a number', function() {
            assert.throws(function() {
                var hpai = new KnxIp.Hpai("192.168.23.45", "foo");
            }, /must be a number/);
        });

        it('throws error if port is not a number', function() {
            var hpai = new KnxIp.Hpai("192.168.23.45", 65535);
            assert.throws(function() {
                hpai = new KnxIp.Hpai("192.168.23.45", 65536);
            }, /must be smaller/);
        });
    })

    describe('_assertAddress', function() {

        var hpai;

        beforeEach(function() {
            hpai = new KnxIp.Hpai("192.168.23.45", 1234);
        });

        it('returns true on an valid ip address', function() {
            assert.ok(hpai._assertAddress("192.168.23.45"));
            assert.ok(hpai._assertAddress("255.255.255.255"));
            assert.ok(hpai._assertAddress("127.0.0.1"));
        });

        it('returns false on non valid ip address', function() {
            assert.ok(!hpai._assertAddress("192.168.23.*"));
            assert.ok(!hpai._assertAddress("255.255.255"));
            assert.ok(!hpai._assertAddress("foo"));
            assert.ok(!hpai._assertAddress(1234));
        });

    });

    describe('toBuffer', function() {

        it('returns correct buffer for defined address and port', function() {
            var hpai = new KnxIp.Hpai("192.168.23.45", 1234),
                buf = hpai.toBuffer();

            assert.ok(buf instanceof Buffer, "Buffer returned");
            assert.equal(buf.length, 8, "Buffer length correct");
            assert.equal(buf[0], 0x08, "Byte for Buffer length correct");
            assert.equal(buf[1], 0x01, "Protocol type is correct");
            assert.equal(buf[2], 192, "IP Address octet 1 correct");
            assert.equal(buf[3], 168, "IP Address octet 2 correct");
            assert.equal(buf[4], 23, "IP Address octet 3 correct");
            assert.equal(buf[5], 45, "IP Address octet 4 correct");
            assert.equal(buf[6], 0x04, "Port octet 1 correct");
            assert.equal(buf[7], 0xd2, "Port octet 2 correct");

        });

    });
});