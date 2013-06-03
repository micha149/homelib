var ImplementationError = require('./Error/ImplementationError');

function getParameterCount(func) {
    var matches = func.toString().match(/^function\s?\((.*)\)/),
        params  = matches[1].split(',');

    return params.length;
}

module.exports = {
    implements: function(object, interface) {
        var key, expected, actual;

        for (key in interface.prototype) {
            actual = object[key];
            expected = interface.prototype[key];

            if (actual === undefined) {
                throw new ImplementationError('Missing property "' + key + '"');
            } else if (typeof expected !== typeof actual) {
                throw new ImplementationError('Property "' + key + '" is type of ' + typeof actual + ', but ' + typeof expected + ' was expected');
            } else if (typeof actual === "function" && (getParameterCount(actual) !== getParameterCount(expected))) {
                throw new ImplementationError('Property "' + key + '" has ' + getParameterCount(actual) + ' parameters, but ' + getParameterCount(expected) + ' was expected');
            }
        }

        return true;
    }
};