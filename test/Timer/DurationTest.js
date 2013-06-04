var homelib = require('../../homelib'),
    Duration = homelib.Timer.Duration,
    UnexpectedValueError = homelib.Error.UnexpectedValueError,
    assert  = require('assert'),
    sinon   = require('sinon')
    each    = require('underscore').each;

describe('Timer.Duration', function() {

    describe('constructor', function() {

        it('acts simply like a number', function() {
            var dur = new Duration(1234);

            assert.equal(dur, 1234);
        });

        it('accepts negative numbers', function() {
            var dur = new Duration(-1234);

            assert.equal(dur, -1234);
        });

        it('throws error on unexpected values', function() {
            assert.throws(function() {
                var dur = new Duration('test');
            }, UnexpectedValueError);

            assert.throws(function() {
                var dur = new Duration({test: 'value'});
            }, UnexpectedValueError);
        });

    });

    var testCases = {
        '30s': 30000,
        '2m': 120000,
        '3h': 10800000,
        '2d': 172800000,
        '4w': 2419200000,
        '5m 30s': 330000,
        '1w 2d': 777600000,
        '-2h': -7200000
    };

    describe('parses string to number of milliseconds', function() {

        each(testCases, function(int, str) {
            it(str + " => " + int, function() {
                assert.equal(new Duration(str), int);
            })
        });

    })

    describe('can be casted to a readable string', function() {

        each(testCases, function(int, str) {
            it(int + " => " + str, function() {
                assert.equal(new Duration(int).toString(), str);
            })
        });
    })

});