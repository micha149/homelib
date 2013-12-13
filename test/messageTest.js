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
                dpt = new Datapoint(),
                adr = new GroupAddress('1/2/3', dpt);
                
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
                dpt = new Datapoint(),
                adr = new GroupAddress('1/2/3', dpt);

            msg.setDestination(adr);

            assert.equal(msg.getDestination(), adr);
        });
    });
    
    describe('.setOrigin()', function() {
        
        it('accepts only instances of PhysicalAddress', function() {
            var msg = new Message(),
                adr = new PhysicalAddress('1.2.3');
                
            msg.setOrigin(adr);
            
            assert.equal(msg._origin, adr);
        });
        
        it('throws an error on other types', function() {
            var msg = new Message(),
                dpt = new Datapoint(),
                adr = new GroupAddress('1/2/3', dpt);
                
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
    
    describe('.getControlByte()', function() {
    
        it('returns bit 4 and 7 by default', function() {
            var msg = new Message();
            assert.equal(msg.getControlByte() & 211, 144);
        });
        
        it('considers repeated flag', function() {
            var msg = new Message();
            assert.equal(msg.getControlByte() & 32, 32);
            msg.setRepeated(true);
            assert.equal(msg.getControlByte() & 32, 0);
        });
        
        it('considers priority value', function() {
            var msg = new Message();
            assert.equal(msg.getControlByte() & 12, 12);
            msg.setPriority('alarm');
            assert.equal(msg.getControlByte() & 12, 8);
            msg.setPriority('system');
            assert.equal(msg.getControlByte() & 12, 0);
        });
        
    });
    
    describe('.getDafRoutingLengthByte()', function() {
    
        it('returns routing count of 6 by default', function() {
            var msg = new Message();
            assert.equal(msg.getDafRoutingLengthByte() & 112, 96);
        });
        
        it('returns correct destination flag', function() {
            var msg = new Message(),
                dpt = new Datapoint(),
                adr = new GroupAddress('1/2/3', dpt);
                
            msg.setDestination(adr);
            assert.equal(msg.getDafRoutingLengthByte() & 128, 128);
        });
        
        it('considers the data length', function() {
            var msg = new Message();
            msg._data = [0x22,0x0B];
            assert.equal(msg.getDafRoutingLengthByte() & 15, 1);
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
    
    describe('.getDataBytes()', function() {
    
        it('returns two bytes, even if data is 0', function() {
            var msg  = new Message(),
                data = msg.getDataBytes();
                      
            assert.equal(data.length, 2);
            assert.equal(data[0], 0);
        });
        
        it('contains command value', function() {
            var data,
                msg = new Message();
                
            msg.setCommand('answer');
            data = msg.getDataBytes();

            assert.equal(data[0], 0);
            assert.equal(data[1] & 192, 64);
        });
        
        it('returns only two bytes if data <= 6bit', function() {
            var data,
                msg  = new Message();
            msg.setData([0x20]);
            data = msg.getDataBytes();

            assert.equal(data.length, 2);
            assert.equal(data[1] & 63, 0x20);            

        });
        
        it('returns three bytes if data is > 6bit', function() {
            var data,
                msg  = new Message();
                
            msg.setData([0x40]);
            data = msg.getDataBytes();

            assert.equal(data.length, 3);
            assert.equal(data[1] & 63, 0x00);
            assert.equal(data[2], 0x40);
        });
        
    });
    
    describe('.toArray()', function() {

        var result,
            expected,
            msg    = new Message(),
            dpt    = new Datapoint(),
            dest   = new GroupAddress('1/2/3', dpt),
            origin = new PhysicalAddress('1.2.3'),
            msgMock    = sinon.mock(msg),
            originMock = sinon.mock(origin),
            destMock   = sinon.mock(dest);
            
        expected = [0xbc, 0xe0, 0x13, 0x1a, 0x22, 0x9b, 0x01, 0x00, 0x81];

        msg.setDestination(dest);
        msg.setOrigin(origin);
        msg.setData([0x01]);
            
        msgMock
            .expects('getControlByte')
            .once()
            .returns(expected[0]);
            
        originMock
            .expects('getRaw')
            .once()
            .returns([expected[2], expected[3]]);
            
        destMock
            .expects('getRaw')
            .once()
            .returns([expected[4], expected[5]]);
            
        msgMock
            .expects('getDafRoutingLengthByte')
            .once()
            .returns(expected[1]);
        
        result = msg.toArray();
                
        it('returns correct bytes', function() {
            assert.deepEqual(result, expected);    
        });
        
        it('uses helper methods to create bytes', function() {
            originMock.verify();
            destMock.verify();
            msgMock.verify();
        });

        it('returns zero addresses if no origin or destination was set', function() {
            var msg = new Message(),
                raw = msg.toArray();

            assert.deepEqual(raw.slice(2,4), [0x00, 0x00], "origin is correct");
            assert.deepEqual(raw.slice(4,6), [0x00, 0x00], "destination is correct");
        });

    });

    describe('.parse()', function() {

        it('parses array of bytes into message object', function() {
            var data = [0xb4, 0xd0, 0x11, 0x04, 0x0a, 0x07, 0x01, 0x00, 0x81],
                msg = Message.parse(data);

            assert.ok(!msg.isRepeated());
            assert.equal(msg.getPriority(), "high");
            assert.equal(msg.getRoutingCounter(), 5);

            assert.deepEqual(msg._origin.toString(), '1.1.4');
            assert.deepEqual(msg._destination.toString(), '1/2/7');

            assert.deepEqual(msg._data, [0x01]);

        });

        it('parses bytes from an example into correct message object', function() {
            var data = [0xbc, 0xe1, 0x11, 0x02, 0x10, 0x00, 0x01, 0x00, 0x81],
                msg = Message.parse(data);

            expect(msg.isRepeated()).to.be.false;
            expect(msg.getPriority()).to.be.equal("normal");
            expect(msg.getRoutingCounter()).to.be.equal(6);

            expect(msg._origin.toString()).to.be.equal('1.1.2');
            expect(msg._destination.toString()).to.be.equal('2/0/0');

            expect(msg._data).to.have.bytes([0x01]);
            expect(msg.getCommand()).to.be.equal('write');
        });

        it('parses bytes with 8 bit data into correct message', function() {
            var data = [0xbc, 0xe1, 0x11, 0x02, 0x10, 0x00, 0x02, 0x00, 0x80, 0xaa],
                msg = Message.parse(data);

            expect(msg.isRepeated()).not.to.be.ok;
            expect(msg.getPriority()).to.be.equal("normal");
            expect(msg.getRoutingCounter()).to.be.equal(6);

            expect(msg._origin.toString()).to.be.equal('1.1.2');
            expect(msg._destination.toString()).to.be.equal('2/0/0');

            expect(msg._data).to.have.bytes([0xaa]);
            expect(msg._command).to.be.equal(2);
        });

    });
});