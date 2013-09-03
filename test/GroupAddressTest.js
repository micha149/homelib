var assert  = require("assert"),
    sinon   = require("sinon"),
    homelib = require('../homelib'),
    GroupAddress = homelib.GroupAddress,
    Datapoint    = homelib.Datapoint;

describe('GroupAddress', function () {

    it("is a constructor", function() {
        assert.equal(typeof GroupAddress, "function");
    });
    
    describe('constructor', function () {
    
        it('expect address and datatype');
        
        it('stores optional title', function () {
            var ga = new GroupAddress("1/2/3", '1.001');
            assert.strictEqual(ga.title, "");
            
            ga = new GroupAddress("1/2/3", '1.001', 'Living Room, Ambient Light');
            assert.strictEqual(ga.title, 'Living Room, Ambient Light');
        });
        
    });
    
    describe('#parse()', function () {

        describe('on main/sublevel addresses', function () {
             
            it('turns a string into two bytes', function() {
                var ga = new GroupAddress('1/2/3', "1.001");
                
                assert.deepEqual(ga.parseAddress("4/13"), [0x20, 0x0D]);
                assert.deepEqual(ga.parseAddress("15/1365"), [0x7d, 0x55]);
                assert.deepEqual(ga.parseAddress("7/0"), [0x38, 0x00]);
                assert.deepEqual(ga.parseAddress("0/0"), [0x00, 0x00]);
            });
            
            it('throws error if sublevel is to high', function() {
                var ga = new GroupAddress('1/2/3', "1.001");
                assert.throws(function() {
                    ga.parseAddress("4/2048");
                });
            });
            
            it('throws error if mainlevel is to high', function() {
                var ga = new GroupAddress('1/2/3', "1.001");
                assert.throws(function() {
                    ga.parseAddress("16/4");
                });
            });
            
        });

        describe('on main/middle/sublevel addresses', function () {
             
            it('turns a string into two octets', function() {
                var ga = new GroupAddress('1/2/3', "1.001");
                
                assert.deepEqual(ga.parseAddress("4/2/155"),  [0x22, 0x9b]);
                assert.deepEqual(ga.parseAddress("11/6/241"), [0x5e, 0xf1]);
                assert.deepEqual(ga.parseAddress("1/0/0"),    [0x08, 0x00]);
                assert.deepEqual(ga.parseAddress("0/0/0"),    [0x00, 0x00]);
            });
            
            it('throws error if sublevel is to high', function() {
                var ga = new GroupAddress('1/2/3', "1.001");
                assert.throws(function() {
                    ga.parseAddress("4/2048");
                });
            });
            
            it('throws error if mainlevel is to high', function() {
                var ga = new GroupAddress('1/2/3', "1.001");
                assert.throws(function() {
                    ga.parseAddress("16/4");
                });
            });
            
        });
        
    });

    it('can be converted to string', function() {
        var ga = new GroupAddress([0x22, 0x9b], "1.001"); // 4/2/155
        assert.equal(ga.toString(), '4/2/155');
    });
    
});