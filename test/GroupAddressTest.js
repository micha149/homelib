var assert = require("assert"),
    sinon  = require("sinon"),
    GroupAddress = require('../src/GroupAddress');

describe('GroupAddress', function () {

    it("is a constructor", function() {
        assert.equal(typeof GroupAddress, "function");
    })
    
    describe('constructor', function () {
    
        it('expect address and datatype');
        
        it('stores optional title', function () {
            var ga = new GroupAddress("1/2/3", '1.001');
            assert.strictEqual(ga.title, null);
            
            ga = new GroupAddress("1/2/3", '1.001', 'Living Room, Ambient Light');
            assert.strictEqual(ga.title, 'Living Room, Ambient Light');
        });
        
    });
    
    describe('#parse()', function () {

        describe('on main/sublevel addresses', function () {
             
            it('turns a string into two octets', function() {
                var ga = new GroupAddress('1/2/3', "1.001");
                
                assert.deepEqual(ga.parseAddress("4/13"), 0x040D);
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
                
                assert.deepEqual(ga.parseAddress("4/2/155"), 0x229b);
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
    
});