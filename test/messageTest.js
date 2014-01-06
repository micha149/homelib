var assert  = require('assert'),
    sinon   = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect,
    homelib         = require('../'),
    Message         = homelib.Message,
    GroupAddress    = homelib.GroupAddress,
    PhysicalAddress = homelib.PhysicalAddress,
    Datapoint       = homelib.Datapoint;
    
describe('Message', function() {

    it('default priority is "normal" (bits 1 1)', function() {
        var msg = new Message();
        assert.equal(msg._priority, 3);
    });
    
    describe('.setPriority()', function() {
        
        it('turns string "system" to bits 0 0', function() {
            var msg = new Message();
            msg.setPriority('system');
            assert.equal(msg._priority, 0);    
        });
        
        it('turns string "alarm" to bits 1 0', function() {
            var msg = new Message();
            msg.setPriority('alarm');
            assert.equal(msg._priority, 2);    
        });
        
        it('turns string "high" to bits 0 1', function() {
            var msg = new Message();
            msg.setPriority('high');
            assert.equal(msg._priority, 1);    
        });
        
        it('turns string "normal" to bits 1 1', function() {
            var msg = new Message();
            msg._priority = null; // 3 is the default so, we need to reset it
            msg.setPriority('normal');
            assert.equal(msg._priority, 3);    
        });
        
        it('throw error on unknown values', function() {
            var msg = new Message();
            assert.throws(function() {
                msg.setPriority('foobar');
            });
        });
        
    });

    it('default command is "write" (bits 1 0)', function() {
        var msg = new Message();
        msg.setCommand('read');
        assert.equal(msg._command, 0);
    });
    
    describe('.setCommand()', function() {
        
        it('tunrs string "read" into bits 0 0', function() {
            var msg = new Message();
            msg.setCommand('read');
            assert.equal(msg._command, 0);
        });
        
        it('tunrs string "write" into bits 1 0', function() {
            var msg = new Message();
            msg._command = null; // 2 is default so, we need to reset it
            msg.setCommand('write');
            assert.equal(msg._command, 2);
        });
        
        it('tunrs string "read" into bits 0 0', function() {
            var msg = new Message();
            msg.setCommand('answer');
            assert.equal(msg._command, 1);
        });
    });
    
    describe('.getCommand()', function() {
    
        it('returns right command', function() {
            var msg = new Message();
            
            msg.setCommand('read');
            assert.equal(msg.getCommand(), "read");
            msg.setCommand('answer');
            assert.equal(msg.getCommand(), "answer");
            msg.setCommand('write');
            assert.equal(msg.getCommand(), "write");
        });
        
    });
    
    describe('.setDestination()', function() {
        
        it('accepts instances of GroupAddress', function() {
            var msg = new Message(),
                adr = sinon.createStubInstance(GroupAddress);
                
            msg.setDestination(adr);
            
            assert.equal(msg._destination, adr);
        });
        
        it('accepts instances of PhysicalAddress');
        
        it('throws an error on other types', function() {
            var msg = new Message();
            assert.throws(function() {
                msg.setDestination("1/2/3");
            });
        });
        
    });

    describe('.getDestination()', function() {
        it ('returns destination address of message', function() {
            var msg = new Message(),
                adr = sinon.createStubInstance(GroupAddress);

            msg.setDestination(adr);

            assert.equal(msg.getDestination(), adr);
        });
    });
    
    describe('.setOrigin()', function() {
        
        it('accepts only instances of PhysicalAddress', function() {
            var msg = new Message(),
                adr = sinon.createStubInstance(PhysicalAddress);
                
            msg.setOrigin(adr);
            
            assert.equal(msg._origin, adr);
        });
        
        it('throws an error on other types', function() {
            var msg = new Message(),
                adr = sinon.createStubInstance(GroupAddress);
                
            assert.throws(function() {
                msg.setOrigin(adr);
            });
        });
        
    });
    
    it('is not "repeated" by default', function() {
        var msg = new Message();
        assert.equal(msg._repeated, false);
    });
    
    describe('.setRepeated()', function() {
    
        it('sets the _repeated property', function() {
            var msg = new Message();
            msg.setRepeated(true);
            assert.equal(msg._repeated, true);
        });
        
        it('sets always a boolean value', function() {
            var msg = new Message();
            msg.setRepeated('yewha');
            assert.equal(msg._repeated, true);
        });
        
    });
    
    describe('.createParity()', function() {
    
        it('creates correct parity for given bytes', function() {
            var msg   = new Message(),
                bytes = [parseInt('10110000', 2),
                         parseInt('00000001', 2),
                         parseInt('00001001', 2),
                         parseInt('00000001', 2),
                         parseInt('00000111', 2),
                         parseInt('00010001', 2),
                         parseInt('00000000', 2),
                         parseInt('10000001', 2)],
                expected = parseInt('11010001', 2);
            assert.equal(msg.createParityByte(bytes), expected);
        });
        
    });
});