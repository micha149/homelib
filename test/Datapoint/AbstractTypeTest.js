var expect = require('chai').expect,
    util = require('util'),
    homelib = require('../../homelib'),
    AbstractType = homelib.Datapoint.AbstractType;

describe('Datapoint.AbstractType', function() {

    describe('creating an instance', function() {

        it('throws error if abstract type is directly instantiated', function() {
            expect(function() {
                var type = new AbstractType();
            }).to.throw(Error);
        });

        it('does not throw error on derivations', function() {
            function Derivation() {
                AbstractType.apply(this, arguments);
            }
            util.inherits(Derivation, AbstractType);

            expect(function() {
                var type = new Derivation({id: null, 'name': null});
            }).not.to.throw(Error);
        });

    });
});