var _ = require('underscore'),
    homelib = require('../../homelib.js'),
    KnxIp = homelib.Driver.KnxIp;

function isSpy(putativeSpy) {
    return typeof putativeSpy === "function" &&
        typeof putativeSpy.getCall === "function" &&
        typeof putativeSpy.calledWithExactly === "function";
}

function toHex(n) {
    if (n < 16) return '0x0' + n.toString(16);
    return "0x" + n.toString(16);
}

function toHexString(arr) {
    return "[" + _.map(arr, toHex).join(", ") + "]";
}

module.exports = function(chai, utils){

    chai.Assertion.addMethod('bytes', function(expected) {
        var actual = this._obj;

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

    chai.Assertion.addMethod('sent', function(expected) {

        var socket = this._obj,
            call,
            callCount,
            expectedByteString,
            actualByteString,
            matches = [];

        if (!isSpy(socket.send)) {
            throw new Error('Method send on given socket needs to be spied');
        }

        if (expected instanceof KnxIp.Packet) {
            expected = expected.toBuffer();
        }

        expectedByteString = toHexString(expected);
        callCount = socket.send.callCount;

        for (var i = 0; i < callCount; i++) {
            call = socket.send.getCall(i);
            actualByteString = toHexString(call.args[0]);

            if (actualByteString === expectedByteString) {
                matches.push(call);
            }
        }

        if (callCount === 1) {
            this.assert(
                matches.length === 1,
                "expected packet #{exp} but got #{act}",
                "expected packet to not be equal to #{act}",
                expectedByteString,
                actualByteString
            );
        } else {
            this.assert(
                matches.length > 0,
                "expected packet #{exp} but no given packet matches",
                "expected not sent packet is equal to #{exp}",
                expectedByteString
            );
        }
    });

};