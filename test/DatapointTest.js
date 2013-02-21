var assert    = require("assert"),
    sinon     = require("sinon"),
    Datapoint = require('../homelib').Datapoint;

describe('Datapoint', function() {

    it("is a constructor", function() {
        assert.equal(typeof Datapoint, "function");
    });

    describe('constructor', function() {
        it('expects an id and a name', function() {
            var dpt = new Datapoint({
                id: '1.0001',
                name: 'DPT_Bool'
            });
            assert.equal(dpt.id, '1.0001');
            assert.equal(dpt.name, 'DPT_Bool');
        });
    })
    
    describe('.get() on module exports', function() {
        it('is a function', function() {
            assert.equal(typeof Datapoint.get, "function");
        })
        it('is not available on instances', function() {
            var dpt = new Datapoint();
            assert.ok(dpt.get !== Datapoint.get);
        })
        it('resolves datapoint object by id', function() {
            var dpt = Datapoint.get('1.0001');
            assert.ok(dpt instanceof Datapoint);
        });
        it('throws an error on unknown ids');
    });
    
    describe('.validate()', function() {
        it('accepts all data by default', function() {
            var dpt = new Datapoint();
            assert.ok(dpt.validate(1));
            assert.ok(dpt.validate(0));
            assert.ok(dpt.validate('foo'));
        })
        
        it('can be overloaded', function() {
            var spy = sinon.spy(),
                dpt = new Datapoint({
                    'id': '1.0001',
                    'name': 'DPT_Bool',
                    'validate': spy
                });
                
            dpt.validate(4711)
            assert.ok(spy.called);
        })
    });
    
    describe('.parse()', function() {
        it('returns given value by default', function() {
            var dpt = new Datapoint();
            assert.strictEqual(dpt.parse(1), 1);
            assert.strictEqual(dpt.parse(0), 0);
            assert.strictEqual(dpt.parse(true), true);
        });

        it('can be overloaded', function() {
            var spy = sinon.spy(),
                dpt = new Datapoint({
                    'id': '1.0001',
                    'name': 'DPT_Bool',
                    'parse': spy
                });
                
            dpt.parse(4711)
            assert.ok(spy.called);
        });
    });
    
});