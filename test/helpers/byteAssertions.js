var _ = require('underscore');

module.exports = function(chai, utils){

    chai.Assertion.addMethod('bytes', function(expected) {
        var actual = this._obj;

        function toHex(n) {
            if (n < 16) return '0x0' + n.toString(16);
            return "0x" + n.toString(16);
        }

        actual = "[" + _.map(this._obj, toHex).join(", ") + "]";
        expected = "[" + _.map(expected, toHex).join(", ") + "]";

        this.assert(
            actual === expected,
            "expected bytes #{exp} but got #{act}",
            "expected bytes to not be equal to #{act}",
            expected,
            actual
        );
    });

};