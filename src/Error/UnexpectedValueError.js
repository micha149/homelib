var util = require('util');

UnexpectedValueError = function() {
    Error.apply(this, arguments)
}

util.inherits(UnexpectedValueError, Error);

module.exports = UnexpectedValueError;