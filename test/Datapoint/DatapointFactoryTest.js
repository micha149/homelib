var homelib = require('../../homelib.js'),
    DatapointFactory = homelib.Datapoint.DatapointFactory,
    sinon = require('sinon'),
    chai    = require('chai'),
    expect  = chai.expect;

describe('DatapointFactory', function() {

    beforeEach(function() {
        this.factory = new DatapointFactory();
    });

    describe('factory', function() {

        it('returns instance by name', function() {
            var dpt = this.factory.get('DPT_Switch');
            expect(dpt).to.be.instanceOf(homelib.Datapoint.AbstractDatapoint);
        });

        it('returns instance by id', function() {
            var dpt = this.factory.get('1.001');
            expect(dpt).to.be.instanceOf(homelib.Datapoint.AbstractDatapoint);
        });

        it('throws exception on unknown definition', function() {
            var factory = this.factory;

            function create() {
                return factory.get('Unknown name');
            }

            expect(create).to.Throw(homelib.Error.UnexpectedValueError);
        });

        it('returns singleton instances', function() {
            var dptFirst = this.factory.get('DPT_Switch'),
                dptSecond = this.factory.get('DPT_Switch');

            expect(dptSecond).to.be.equal(dptFirst);
        });

    });

});