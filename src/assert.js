var ImplementationError = require('./Error/ImplementationError');

module.exports = {
    implements: function(object, interfaceObject) {
        var key, expected, actual;

        for (key in interfaceObject.prototype) {
            actual = object[key];
            expected = interfaceObject.prototype[key];

            if (actual === undefined) {
                throw new ImplementationError('Missing property "' + key + '"');
            } else if (typeof expected !== typeof actual) {
                throw new ImplementationError('Property "' + key + '" is type of ' + typeof actual + ', but ' + typeof expected + ' was expected');
            }
        }

        return true;
    }
};