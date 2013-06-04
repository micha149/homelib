var util = require('util');

function UnexpectedValueError (msg, constr) {
    Error.captureStackTrace(this, constr || this);
    this.message = msg || 'Error';
}

util.inherits(UnexpectedValueError, Error);

UnexpectedValueError.prototype.name= "Unexpected Value Error";

module.exports = UnexpectedValueError;