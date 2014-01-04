var GroupAddress    = require('./GroupAddress.js'),
    PhysicalAddress = require('./PhysicalAddress.js');

/**
 * The Message class indicates all data of a bus telegram. This implementation
 * is based on the standard cemi message frame
 *
 * @constructor
 */
function Message () {
    this._priority       = 3;
    this._repeated       = false;
    this._routingCounter = 6;
    this._destination    = null;
    this._origin         = null;
    this._data           = [];
    this._command        = 2;
}

/**
 * Set the command for this message
 *
 * @param     {"read"|"write"|"answer"} command Command name
 * @return    {Message} this
 * @chainable
 */
Message.prototype.setCommand = function(command) {
    switch (command) {
        case "read":
            this._command = 0;
            break;
        case "write":
            this._command = 2;
            break;
        case "answer":
            this._command = 1;
            break;
        default:
            throw new Error('Unknown value "' + command + '" for message command');
    }
    
    return this;
};

/**
 * Returns the configured message command
 *
 * @returns {string} command
 */
Message.prototype.getCommand = function() {
    switch (this._command) {
        case 0: return "read";
        case 2: return "write";
        case 1: return "answer";
    }
};

/**
 * Set the priority of this message.
 *
 * @param     {"system"|"alarm"|"high"|"normal"} priority Priority name
 * @return    {Message} this
 * @chainable
 */
Message.prototype.setPriority = function(priority) {
    switch (priority) {
        case "system":
            this._priority = 0;
            break;
        case "alarm":
            this._priority = 2;
            break;
        case "high":
            this._priority = 1;
            break;
        case "normal":
            this._priority = 3;
            break;
        default:
            throw new Error('Unknown value "' + priority + '" for message priority');
    }
    return this;
};

/**
 * Returns the human readable priority of this message
 *
 * @returns {string}
 */
Message.prototype.getPriority = function() {
    switch (this._priority) {
        case 0:
            return "system";
        case 2:
            return "alarm";
        case 1:
            return "high";
        case 3:
            return "normal";
    }
};

/**
 * Set, if this message is an repeated message.
 *
 * @param     {Boolean} repeated True if repeated
 * @return    {Message} this
 * @chainable
 */
Message.prototype.setRepeated = function(repeated) {
    this._repeated = repeated !== false;
};

/**
 * Returns if this message should be repeated by routers.
 *
 * @returns {Boolean}
 */
Message.prototype.isRepeated = function() {
    return this._repeated;
};

/**
 * Sets the destination of this message
 *
 * @param     {PhysicalAddress|GroupAddress} address Destination Address
 * @return    {Message} this
 * @chainable
 */
Message.prototype.setDestination = function(address) {
    if (!(address instanceof GroupAddress)) {
        throw new Error('Destination can only be a instance of GroupAddress');
    }
    this._destination = address;
    return this;
};

/**
 * Returns destination address of this message
 *
 * @returns {GroupAddress|PhysicalAddress}
 */
Message.prototype.getDestination = function() {
    return this._destination;
};

/**
 * Sets the origin of this message
 *
 * @param     {PhysicalAddress} address Origin Address
 * @return    {Message} this
 * @chainable
 */
Message.prototype.setOrigin = function(address) {
    if (!(address instanceof PhysicalAddress)) {
        throw new Error('Origin can only be a instance of PhysicalAddress');
    }
    this._origin = address;
    return this;
};

/**
 * Returns origin address of this message
 *
 * @returns {PhysicalAddress}
 */
Message.prototype.getOrigin = function() {
    return this._origin;
};

Message.prototype.setRoutingCounter = function(hops) {
    this._routingCounter = hops;
};

Message.prototype.getRoutingCounter = function() {
    return this._routingCounter;
};

Message.prototype.setData = function(data) {
    this._data = data;
};

Message.prototype.getData = function() {
    return this._data;
};

/**
 * Returns the parity byte for this message. It is calculated by
 * a cross parity over all given bytes.
 *
 * @param  {Number[]} bytes Array with bytes to consider
 * @return {Number} Byte
 */
Message.prototype.createParityByte = function(bytes) {
    var i,
        parity = 255,
        curBit = 1;
        
    while (curBit <= 128) {
        for (i = 0; i < bytes.length; i++) {
            parity ^= bytes[i] & curBit;
        }
        curBit = curBit << 1;
    }
    
    return parity;
};

module.exports = Message;