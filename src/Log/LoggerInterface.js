/**
 * Interface object for logger objects
 *
 * @class Log.LoggerInterface
 * @constructor
 */
function LoggerInterface() {}

LoggerInterface.prototype.silly = function(msg) {};
LoggerInterface.prototype.debug = function(msg) {};
LoggerInterface.prototype.verbose = function(msg) {};
LoggerInterface.prototype.info = function(msg) {};
LoggerInterface.prototype.warn = function(msg) {};
LoggerInterface.prototype.error = function(msg) {};

module.exports = LoggerInterface;