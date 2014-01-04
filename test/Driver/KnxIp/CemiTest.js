var Buffer = require('buffer').Buffer,
    homelib = require('../../../homelib.js'),
    KnxIp = homelib.Driver.KnxIp,
    sinon = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect;

describe('Cemi', function() {

    beforeEach(function() {
        this.destination = sinon.createStubInstance(homelib.GroupAddress);
        this.destination.getRaw.returns([1,2]);

        this.origin = sinon.createStubInstance(homelib.PhysicalAddress);
        this.origin.getRaw.returns([3,4]);

        this.message = sinon.createStubInstance(homelib.Message);
        this.message.getPriority.returns("normal");
        this.message.isRepeated.returns(true);
        this.message.getCommand.returns("read");
        this.message.getData.returns([]);
        this.message.getDestination.returns(this.destination);
        this.message.getOrigin.returns(this.origin);

        this.cemi = new KnxIp.Cemi('L_Data.req', this.message);
    });

    it('needs message as constructor param', function() {

        expect(function() {
            var cemi = new KnxIp.Cemi('L_Data.con');
        }).to.throw(Error, /message.*expected/i);

        expect(this.cemi.getMessage()).to.be.equal(this.message);
    });

    describe('converting to byte array', function() {

        it('adds correct message code byte', function() {
            var cemi;

            cemi = new KnxIp.Cemi('L_Data.con', this.message);
            expect(cemi.toArray()[0]).to.be.equal(0x2e);

            cemi = new KnxIp.Cemi('L_Data.req', this.message);
            expect(cemi.toArray()[0]).to.be.equal(0x11);
        });

        it('adds length for additional data of 0', function() {
            expect(this.cemi.toArray()[1]).to.be.equal(0);
        });

        it('adds control byte', function() {
            var cemi = this.cemi,
                msg  = this.message;

            msg.isRepeated.returns(false);
            msg.getPriority.returns('normal');

            expect(cemi.toArray()[2]).to.be.equal(0xbc);

            msg.isRepeated.returns(true);
            msg.getPriority.returns('alarm');

            expect(cemi.toArray()[2]).to.be.equal(0x98);
        });

        it('adds dlr byte', function() {
            var cemi = this.cemi,
                msg  = this.message;

            msg.getRoutingCounter.returns(6);
            msg.getDestination.returns(sinon.createStubInstance(homelib.GroupAddress));

            expect(cemi.toArray()[3]).to.be.equal(0xe0);

            msg.getRoutingCounter.returns(3);
            msg.getDestination.returns(sinon.createStubInstance(homelib.PhysicalAddress));

            expect(cemi.toArray()[3]).to.be.equal(0x30);
        });

        it('adds origin address bytes', function() {
            var cemi = this.cemi,
                msg  = this.message,
                origin = sinon.createStubInstance(homelib.PhysicalAddress);

            origin.getRaw.returns([3,4]);
            msg.getOrigin.returns(origin);

            expect(cemi.toArray()[4]).to.be.equal(3);
            expect(cemi.toArray()[5]).to.be.equal(4);
        });

        it('adds destination address bytes', function() {
            var cemi = this.cemi,
                msg  = this.message,
                dest = sinon.createStubInstance(homelib.GroupAddress);

            dest.getRaw.returns([0x08, 0x02]);
            msg.getDestination.returns(dest);

            expect(cemi.toArray()[6]).to.be.equal(0x08);
            expect(cemi.toArray()[7]).to.be.equal(0x02);
        });

        it('adds length of contained data', function() {
            var cemi = this.cemi,
                msg  = this.message;

            msg.getData.returns([1]);
            expect(cemi.toArray()[8]).to.be.equal(0x01);

            msg.getData.returns([128]);
            expect(cemi.toArray()[8]).to.be.equal(0x02);


            msg.getData.returns([1, 2]);
            expect(cemi.toArray()[8]).to.be.equal(0x03);
        });

        it('adds data bytes', function() {
            var cemi = this.cemi,
                msg  = this.message;

            msg.getCommand.returns('write');
            msg.getData.returns([1]);

            expect(cemi.toArray()[9]).to.be.equal(0x00);
            expect(cemi.toArray()[10]).to.be.equal(0x81);

            msg.getData.returns([64]);

            expect(cemi.toArray()[9]).to.be.equal(0x00);
            expect(cemi.toArray()[10]).to.be.equal(0x80);
            expect(cemi.toArray()[11]).to.be.equal(0x40);

            msg.getData.returns([1, 2]);

            expect(cemi.toArray()[9]).to.be.equal(0x00);
            expect(cemi.toArray()[10]).to.be.equal(0x80);
            expect(cemi.toArray()[11]).to.be.equal(0x01);
            expect(cemi.toArray()[12]).to.be.equal(0x02);
        });
    });

    describe('parsing array of bytes', function() {

        it('parses array of bytes into message object', function() {
            var data = [0x11, 0x00, 0xb4, 0xd0, 0x11, 0x04, 0x0a, 0x07, 0x01, 0x00, 0x81],
                cemi = KnxIp.Cemi.parse(data),
                msg = cemi.getMessage();

            expect(cemi.getMessageCode()).to.be.equal("L_Data.req");

            expect(msg.isRepeated()).to.be.false;
            expect(msg.getPriority()).to.be.equal("high");
            expect(msg.getRoutingCounter()).to.be.equal(5);

            expect(msg._origin.toString()).to.be.equal('1.1.4');
            expect(msg._destination.toString()).to.be.equal('1/2/7');

            expect(msg.getData()).to.be.deep.equal([0x01]);

        });

        it('parses bytes from an example into correct message object', function() {
            var data = [0x11, 0x00, 0xbc, 0xe1, 0x11, 0x02, 0x10, 0x00, 0x01, 0x00, 0x81],
                cemi = KnxIp.Cemi.parse(data),
                msg = cemi.getMessage();

            expect(msg.isRepeated()).to.be.false;
            expect(msg.getPriority()).to.be.equal("normal");
            expect(msg.getRoutingCounter()).to.be.equal(6);

            expect(msg._origin.toString()).to.be.equal('1.1.2');
            expect(msg._destination.toString()).to.be.equal('2/0/0');

            expect(msg._data).to.have.bytes([0x01]);
            expect(msg.getCommand()).to.be.equal('write');
        });

        it('parsed data is same as result of toArray()', function() {
            var expected = [0x11, 0x00, 0xbc, 0xe0, 0x11, 0x02, 0x10, 0x00, 0x01, 0x00, 0x81],
                cemi = KnxIp.Cemi.parse(expected);

            expect(cemi.toArray()).to.have.bytes(expected);
        });

        it('parses bytes with 8 bit data into correct message', function() {
            var data = [0x11, 0x00, 0xbc, 0xe1, 0x11, 0x02, 0x10, 0x00, 0x02, 0x00, 0x80, 0xaa],
                cemi = KnxIp.Cemi.parse(data),
                msg = cemi.getMessage();

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