function ConsoleAdapter (customConsole) {
    this._console = customConsole || console;
}

ConsoleAdapter.prototype.emergency = function(msg) {
    this._console.error.apply(this, arguments);
}

ConsoleAdapter.prototype.alert = function(msg) {
    this._console.error.apply(this, arguments);
}

ConsoleAdapter.prototype.critical = function(msg) {
    this._console.error.apply(this, arguments);
}

ConsoleAdapter.prototype.error = function(msg) {
    this._console.error.apply(this, arguments);
}

ConsoleAdapter.prototype.warning = function(msg) {
    this._console.warn.apply(this, arguments);
}

ConsoleAdapter.prototype.notice = function(msg) {
    this._console.log.apply(this, arguments);
}

ConsoleAdapter.prototype.info = function(msg) {
    this._console.log.apply(this, arguments);
}

ConsoleAdapter.prototype.debug = function(msg) {
    this._console.log.apply(this, arguments);
}

module.exports = ConsoleAdapter;