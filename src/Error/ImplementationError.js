var util = require('util');

ImplementationError = function(msg, constr) {
    Error.captureStackTrace(this, constr || this)
    this.message = msg || 'Error'
}

util.inherits(ImplementationError, Error);

ImplementationError.prototype.name= "Implementation Error";

module.exports = ImplementationError;