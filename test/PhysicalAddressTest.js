var assert  = require("assert"),
    sinon   = require("sinon"),
    PhysicalAddress = require('../homelib').PhysicalAddress;

describe('PhysicalAddress', function () {

    it("is a constructor", function() {
        assert.equal(typeof PhysicalAddress, "function");
    });
    
    describe('constructor', function () {
        
        it('parses and stores addres', function() {
            var adr = new PhysicalAddress('1.2.3');
            assert.deepEqual(adr._address, [0x12, 0x03]);
        });

        it('accepts array with two bytes', function() {        
            var adr = new PhysicalAddress([0x12, 0x03]);
            assert.deepEqual(adr._address, [0x12, 0x03]);
        });
        
        it('expect address', function() {
            var adr;
            assert.throws(function() {
                var adr = new PhysicalAddress('17.2.3');
            });
            assert.throws(function() {
                var adr = new PhysicalAddress([1,2,3]);
            });
        });
        
    });
    
    describe('#parse()', function () {
             
        it('turns a string into two octets', function() {
            var adr = new PhysicalAddress('1.2.3');
            
            assert.deepEqual(adr.parseAddress("4.2.155"),  [0x42, 0x9b]);
            assert.deepEqual(adr.parseAddress("11.6.241"), [0xb6, 0xf1]);
            assert.deepEqual(adr.parseAddress("1.0.0"),    [0x10, 0x00]);
            assert.deepEqual(adr.parseAddress("0.0.0"),    [0x00, 0x00]);
        });
        
        it('throws error if area value is to high', function() {
            var ga = new PhysicalAddress('1.2.3');
            assert.throws(function() {
                ga.parseAddress("16/2/2");
            });
        });
        
        it('throws error if area value is to high', function() {
            var ga = new PhysicalAddress('1.2.3');
            assert.throws(function() {
                ga.parseAddress("4/16/2");
            });
        });
        
        it('throws error if member value is to high', function() {
            var ga = new PhysicalAddress('1.2.3');
            assert.throws(function() {
                ga.parseAddress("4.2.260");
            });
        });
    });

    it('can be converted to string representation', function() {
        var addr = new PhysicalAddress("11.6.241");
        assert.equal(addr.toString(), "11.6.241");
    });
    
});