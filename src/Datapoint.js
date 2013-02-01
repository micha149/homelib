var _ = require('underscore');

var defaults = {
    validate: function (value) {
        return true;
    }
};

var Datapoint = function(options) {
    _.extend(this, defaults, options);
}


module.exports = Datapoint;

module.exports.get = function(str) {
    return new Datapoint();
};