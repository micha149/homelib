function NullLogger () {
}

NullLogger.prototype.emergency = function(msg) {}

NullLogger.prototype.alert = function(msg) {}

NullLogger.prototype.critical = function(msg) {}

NullLogger.prototype.error = function(msg) {}

NullLogger.prototype.warning = function(msg) {}

NullLogger.prototype.notice = function(msg) {}

NullLogger.prototype.info = function(msg) {}

NullLogger.prototype.debug = function(msg) {}

module.exports = NullLogger;