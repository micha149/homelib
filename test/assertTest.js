var assert = require('assert'),
    myAssert = require('../homelib').assert,
    implements = myAssert.implements;

describe('assert', function() {

    describe('.implements()', function() {

        var interface = function() {};
        interface.prototype.methodOne = function() {}
        interface.prototype.methodTwo = function(paramA, paramB) {}
        interface.prototype.propOne = "A string";
        interface.prototype.propTwo = 123;
        interface.prototype.propThree = false;

        it('returns true if all semes to be be in order, gordon.', function() {

            var object = {
                methodOne: function() {},
                methodTwo: function(paramA, paramB) {},
                propOne: "A string",
                propTwo: 123,
                propThree: false
            };

            assert.ok(implements(object, interface));

        });

        it('throws error if a property is not defined', function() {

            var object = {
                methodTwo: function(paramA, paramB) {},
                propOne: "A string",
                propTwo: 123,
                propThree: false
            };

            assert.throws(function() {
                implements(object, interface);
            }, /methodOne/);

        });

        it('throws error if a property has the wrong type', function() {

            var object = {
                methodOne: function() {},
                methodTwo: function(paramA, paramB) {},
                propOne: 815,
                propTwo: 123,
                propThree: false
            };

            assert.throws(function() {
                implements(object, interface);
            }, /propOne/);

        });

    });

})