function NullLogger () {
}

NullLogger.prototype.silly = function(msg) {};
NullLogger.prototype.debug = function(msg) {};
NullLogger.prototype.verbose = function(msg) {};
NullLogger.prototype.info = function(msg) {};
NullLogger.prototype.warn = function(msg) {};
NullLogger.prototype.error = function(msg) {};

module.exports = NullLogger;