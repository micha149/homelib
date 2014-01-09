var assert  = require("assert"),
    sinon   = require("sinon"),
    expect  = require('chai').expect,
    homelib = require('../homelib'),
    GroupAddress = homelib.GroupAddress,
    Datapoint    = homelib.Datapoint;

describe('GroupAddress', function () {
    
    describe('creating an instance', function () {
    
        it('by number', function() {
            var ga = new GroupAddress(2563);
            expect(ga.getNumber()).to.be.equal(2563);
        });

        it('by number', function() {
            var ga = new GroupAddress("1/2/3");
            expect(ga.getNumber()).to.be.equal(2563);
        });

        it('by array', function() {
            var ga = new GroupAddress([0x7d, 0x55]);
            expect(ga.getNumber()).to.be.equal(32085);
        });

        it('throws an error if given value is not usable', function() {
            expect(function() {
                var ga = new GroupAddress({a: 123, b: 123});
            }).to.Throw(homelib.Error.UnexpectedValueError);

            expect(function() {
                var ga = new GroupAddress(65536);
            }).to.Throw(homelib.Error.UnexpectedValueError);

            expect(function() {
                var ga = new GroupAddress([1, 2, 3]);
            }).to.Throw(homelib.Error.UnexpectedValueError);
        });
    });
    
    describe('parsing strings', function () {

        describe('on main/sublevel addresses', function () {
             
            it('leads to correct values', function() {
                var ga;

                ga = new GroupAddress("4/13");
                expect(ga.getNumber()).to.be.equal(8205);

                ga = new GroupAddress("15/1365");
                expect(ga.getNumber()).to.be.equal(32085);

                ga = new GroupAddress("7/0");
                expect(ga.getNumber()).to.be.equal(14336);

                ga = new GroupAddress("0/0");
                expect(ga.getNumber()).to.be.equal(0);
            });

            it('throws error if sublevel is to high', function() {
                expect(function() {
                    var ga = new GroupAddress("4/2048");
                }).to.Throw(homelib.Error.UnexpectedValueError);
            });

            it('throws error if mainlevel is to high', function() {
                expect(function() {
                    var ga = new GroupAddress("16/4");
                }).to.Throw(homelib.Error.UnexpectedValueError);
            });

        });

        describe('on main/middle/sublevel addresses', function () {
             
            it('leads to correct values', function() {
                var ga;

                ga = new GroupAddress("4/2/155");
                expect(ga.getNumber()).to.be.equal(8859);

                ga = new GroupAddress("11/6/241");
                expect(ga.getNumber()).to.be.equal(24305);

                ga = new GroupAddress("1/0/0");
                expect(ga.getNumber()).to.be.equal(2048);

                ga = new GroupAddress("0/0/0");
                expect(ga.getNumber()).to.be.equal(0);
            });
            
            it('throws error if sublevel is to high', function() {
                expect(function() {
                    var ga = new GroupAddress("4/2/256");
                }).to.Throw(homelib.Error.UnexpectedValueError);
            });

            it('throws error if sublevel is to high', function() {
                expect(function() {
                    var ga = new GroupAddress("4/8/100");
                }).to.Throw(homelib.Error.UnexpectedValueError);
            });

            it('throws error if sublevel is to high', function() {
                expect(function() {
                    var ga = new GroupAddress("16/2/100");
                }).to.Throw(homelib.Error.UnexpectedValueError);
            });
            
        });
        
    });

    it('returns raw data as array of two bytes', function() {
        var ga = new GroupAddress(8859);
        expect(ga.getRaw()).to.have.bytes([0x22, 0x9b]);
    });

    it('can be restored from raw data', function() {
        var ga = new GroupAddress(8859),
            ga2 = new GroupAddress(ga.getRaw());

        expect(ga2).to.be.deep.equal(ga);
    });

    it('can be converted to string', function() {
        var ga = new GroupAddress(8859);
        assert.equal(ga.toString(), '4/2/155');
    });
    
});