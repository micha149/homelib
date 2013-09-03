function LoggerInterface() {}

LoggerInterface.prototype.emergency = function(msg) {};
LoggerInterface.prototype.alert = function(msg) {};
LoggerInterface.prototype.critical = function(msg) {};
LoggerInterface.prototype.error = function(msg) {};
LoggerInterface.prototype.warning = function(msg) {};
LoggerInterface.prototype.notice = function(msg) {};
LoggerInterface.prototype.info = function(msg) {};
LoggerInterface.prototype.debug = function(msg) {};

module.exports = LoggerInterface;