var homelib = require('../../homelib.js'),
    TimeType = homelib.Datapoint.TimeType,
    sinon = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect;

describe('Datapoint', function() {

    beforeEach(function() {
        this.time = new TimeType({
            "id": '10.001',
            "name": 'DPT_TimeOfDay'
        });
    });

    describe('BinaryType', function() {

        it('returns correct ID', function() {
            expect(this.time.getId()).to.be.equal('10.001');
        });

        it('returns correct type', function() {
            expect(this.time.getType()).to.be.equal('PDT_TIME');
        });

        it('returns correct name', function() {
            expect(this.time.getName()).to.be.equal('DPT_TimeOfDay');
        });

        it('decodes data correctly', function() {
            var day = 5,
                hours = 18,
                minutes = 16,
                seconds = 47,
                data = [(day << 5) | hours, minutes, seconds],
                date;

            date = this.time.decode(data);

            expect(date.getDay()).to.be.equal(day);
            expect(date.getHours()).to.be.equal(hours);
            expect(date.getMinutes()).to.be.equal(minutes);
            expect(date.getSeconds()).to.be.equal(seconds);
        });

        it('encodes data correctly', function() {
            var date = new Date("Tue Jan 21 2014 19:20:11 GMT+0100 (CET)"),
                data;

            data = this.time.encode(date);

            expect(data[0] >> 5).to.be.equal(date.getDay());
            expect(data[0] & 63).to.be.equal(date.getHours());
            expect(data[1]).to.be.equal(date.getMinutes());
            expect(data[2]).to.be.equal(date.getSeconds());
        });

    });

});