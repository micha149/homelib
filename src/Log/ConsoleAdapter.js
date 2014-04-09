/**
 * Console adapter for internal logger. Passes all log calls
 * to node console object.
 *
 * @class Log.ConsoleAdapter
 * @param {Object} customConsole
 * @constructor
 */
function ConsoleAdapter (customConsole) {
    this._console = customConsole || console;
}

ConsoleAdapter.prototype.error = function(msg) {
    this._console.error.apply(this, arguments);
};

ConsoleAdapter.prototype.warning = function(msg) {
    this._console.warn.apply(this, arguments);
};

ConsoleAdapter.prototype.info = function(msg) {
    this._console.info.apply(this, arguments);
};

ConsoleAdapter.prototype.verbose = function(msg) {
    this._console.debug.apply(this, arguments);
};

ConsoleAdapter.prototype.debug = function(msg) {
    this._console.debug.apply(this, arguments);
};

ConsoleAdapter.prototype.silly = function(msg) {
    this._console.debug.apply(this, arguments);
};

module.exports = ConsoleAdapter;