var homelib = require('../../homelib.js'),
    BinaryType = homelib.Datapoint.BinaryType,
    sinon = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect;

describe('Datapoint', function() {

    beforeEach(function() {
        this.switch = new BinaryType({
            "id": '1.001',
            "name": 'DPT_Switch',
            "valueMap": {
                "0": "Off",
                "1": "On"
            }
        });
    });

    describe('BinaryType', function() {

        it('returns correct ID', function() {
            expect(this.switch.getId()).to.be.equal('1.001');
        });

        it('returns correct type', function() {
            expect(this.switch.getType()).to.be.equal('PDT_BINARY_INFORMATION');
        });

        it('returns correct name', function() {
            expect(this.switch.getName()).to.be.equal('DPT_Switch');
        });

        it('validates data correctly', function() {
            expect(this.switch.validate(1)).to.be.true;
            expect(this.switch.validate(0)).to.be.true;
            expect(this.switch.validate(2)).to.be.false;
        });

        it('transforms readable input into array of bytes', function() {
            expect(this.switch.parse('On')).to.be.deep.equal([1]);
            expect(this.switch.parse('Off')).to.be.deep.equal([0]);
        });

        it('throws error if readable input could no be converted', function() {
            var sw = this.switch;

            expect(function() {
                sw.parse('Fooo');
            }).to.throw(homelib.Error.UnexpectedValueError);
        });

        it('transforms array of bytes to readable string', function() {
            expect(this.switch.transform([1])).to.be.equal('on');
            expect(this.switch.transform([0])).to.be.equal('off');
        });

        it('throws error if transform gets wrong data', function() {
            var sw = this.switch;

            expect(function() {
                sw.transform([3]);
            }).to.throw(homelib.Error.UnexpectedValueError);

            expect(function() {
                sw.transform(1);
            }).to.throw(homelib.Error.UnexpectedValueError);

            expect(function() {
                sw.transform([1, 2]);
            }).to.throw(homelib.Error.UnexpectedValueError);
        });

    });

});