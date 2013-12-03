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
    this._data           = [0];
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

Message.prototype.getRoutingCounter = function() {
    return this._routingCounter;
};

Message.prototype.setData = function(data) {
    this._data = data;
};

/**
 * The control byte contains information about the messages priority (P)
 * and if this message is repeated (R). Messages will be repeated, if any
 * component can't validate it and sends an NAK reply. Component which have
 * received the first message successfull shoud not execute its command again.
 *
 *     +-----+----+----+----+---+---+---+---+
 *     |  1     0 |  R |  1 |   P   | 0   0 |
 *     +-----+----+----+----+---+---+---+---+
 *     | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
 *     +-----+----+----+----+---+---+---+---+
 *
 * @return {Number} Byte
 */
Message.prototype.getControlByte = function() {
    var value = 144;
    
    value |= (this._repeated ? 0 : 32);
    value |= (this._priority & 3) << 2;
    
    return value;
};


/**
 * Returns one byte which contains the destination address flag,
 * the routing counter and the length of the transmitted data.
 *
 *     +-----+--------------+---------------+
 *     | daf |    routing   |    length     |
 *     +-----+----+----+----+---+---+---+---+
 *     | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
 *     +-----+----+----+----+---+---+---+---+
 *
 *  @return {Number} Byte
 */
Message.prototype.getDafRoutingLengthByte = function() {
    var value = 0;
    value |= (this._destination instanceof GroupAddress) ? 128 : 0;
    value |= (this._routingCounter & 7) << 4;
    value |= (this._data.length - 1) & 15;
    return value;
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

/**
 * Returns the data information part of a message. The length of the
 * returned array depends on the telegram data information. If the
 * information is smaller than 6bits, it will be contained in the first
 * to command bytes. Elsewhere it will be appended after the to command
 * bytes.
 *
 * @returns {Number[]} Data bytes
 */
Message.prototype.getDataBytes = function() {
    var data = [0];
        
    data.push(this._command << 6);
    
    if (this._data.length === 1 && this._data[0] < 64) {
        data[1] = data[1] | this._data[0];
    } else {
        data.push.apply(data, this._data);
    }
    
    return data;
};

/**
 * Returns the raw information of an telegram, which can be transmitted
 * through the bus.
 *
 * @returns {Number[]} Array with bytes to transmit
 */
Message.prototype.toArray = function() {
    var raw = [],
        origin = this._origin ? this._origin.getRaw() : [0, 0],
        destination = this._destination ? this._destination.getRaw() : [0, 0],
        data = this.getDataBytes();

    raw.push(this.getControlByte());
    raw.push(this.getDafRoutingLengthByte());
    raw.push.apply(raw, origin);
    raw.push.apply(raw, destination);
    raw.push(data.length - 1);
    raw.push.apply(raw, data);
    
    return raw;
};

/**
 * Parses a given buffer into a message instance
 *
 * @param  {buffer.Buffer} buffer
 * @return {Message}
 * @static
 */
Message.parse = function(data) {
    var msg     =  new Message(),
        dataLength = data[6],
        payload = data.slice(7);

    msg._priority = (data[0] & 12) >> 2;
    msg._repeated = (data[0] & 32) === 0;
    msg._routingCounter = (data[1] & 112) >> 4;
    msg._origin = new PhysicalAddress([data[2], data[3]]);
    msg._destination = new GroupAddress([data[4], data[5]], 3);
    msg._command = (payload[0] & 3) << 2 | (payload[1] & 192) >> 6;

    if (dataLength <= 1) {
        msg._data = [payload[1] & 63];
    } else {
        msg._data = payload.slice(2);
    }

    return msg;
};

module.exports = Message;