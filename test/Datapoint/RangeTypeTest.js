var homelib = require('../../homelib.js'),
    RangeType = homelib.Datapoint.RangeType,
    sinon = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect;

describe('Datapoint', function() {

    beforeEach(function() {
        this.type = new RangeType({
            "id": "5.001",
            "name": "DPT_Scaling",
            "type": "1ByteRangeType",
            "min": 0,
            "max": 100,
            "unit": "%"
        });
    });

    describe('RangeType', function() {

        it('returns correct ID', function() {
            expect(this.type.getId()).to.be.equal('5.001');
        });

        it('returns correct type', function() {
            expect(this.type.getType()).to.be.equal('PDT_TIME');
        });

        it('returns correct name', function() {
            expect(this.type.getName()).to.be.equal('DPT_Scaling');
        });

        describe('on range of 0 to 100', function() {

            beforeEach(function() {
                this.type = new RangeType({
                    "id": "5.001",
                    "name": "DPT_Scaling",
                    "type": "1ByteRangeType",
                    "min": 0,
                    "max": 100,
                    "unit": "%"
                });
            });

            it('decodes data correctly', function() {
                expect(this.type.decode([0])).to.be.equal(0);
                expect(this.type.decode([128])).to.be.closeTo(50, 0.4);
                expect(this.type.decode([255])).to.be.equal(100);
            });

            it('encodes data correctly', function() {
                expect(this.type.encode(0)).to.be.deep.equal([0]);
                expect(this.type.encode(50)).to.be.deep.equal([128]);
                expect(this.type.encode(100)).to.be.deep.equal([255]);
            });

        });

        describe('on range of 0 to 360°', function() {

            beforeEach(function() {
                this.type = new RangeType({
                    "id": "5.003",
                    "name": "DPT_Scaling",
                    "type": "1ByteRangeType",
                    "min": 0,
                    "max": 360,
                    "unit": "°"
                });
            });

            it('decodes data correctly', function() {
                expect(this.type.decode([0])).to.be.equal(0);
                expect(this.type.decode([128])).to.be.closeTo(180, 1.4);
                expect(this.type.decode([255])).to.be.equal(360);
            });

            it('encodes data correctly', function() {
                expect(this.type.encode(0)).to.be.deep.equal([0]);
                expect(this.type.encode(180)).to.be.deep.equal([127]);
                expect(this.type.encode(360)).to.be.deep.equal([255]);
            });

        });

        describe('on range of -128 to 127°', function() {

            beforeEach(function() {
                this.type = new RangeType({
                    "id": "6.001",
                    "name": "DPT_Scaling",
                    "type": "1ByteRangeType",
                    "min": -128,
                    "max": 127,
                    "unit": "%"
                });
            });

            it('decodes data correctly', function() {
                expect(this.type.decode([0])).to.be.equal(-128);
                expect(this.type.decode([128])).to.be.equal(0);
                expect(this.type.decode([255])).to.be.equal(127);
            });

            it('encodes data correctly', function() {
                expect(this.type.encode(-128)).to.be.deep.equal([0]);
                expect(this.type.encode(0)).to.be.deep.equal([128]);
                expect(this.type.encode(127)).to.be.deep.equal([255]);
            });

        });

    });

});