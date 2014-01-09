var Message = require('../../Message'),
    GroupAddress = require('../../GroupAddress'),
    PhysicalAddress = require('../../PhysicalAddress'),
    _ = require('underscore');

var messageCodes = {
    "L_Raw.req": 0x10,
    "L_Data.req": 0x11,
    "L_Poll_Data.req": 0x13,
    "L_Poll_Data.con": 0x25,
    "L_Data.ind": 0x29,
    "L_Busmon.ind": 0x2b,
    "L_Raw.ind": 0x2d,
    "L_Data.con": 0x2e,
    "L_Raw.con": 0x2f
};
var messageCodesInverted = _.invert(messageCodes);

var messageCommands = {
    "read": 0x00,
    "write": 0x02,
    "answer": 0x01
};
var messageCommandsInverted = _.invert(messageCommands);

var messagePriorities = {
    "system": 0x00,
    "alarm": 0x02,
    "high": 0x01,
    "normal": 0x03
};
var messagePrioritiesInverted = _.invert(messagePriorities);

/**
 * Object representation for a Cemi frame. An instance will wrap a given
 * message object and is able to translate the message properties into a
 * byte array.
 *
 * @class Driver.KnxIp.Cemi
 *
 * @constructor
 * @param {String} code Cemi message code
 * @param {Message} msg Message instance to wrap
 */
function Cemi (code, msg) {

    if (!msg || !msg instanceof Message) {
        throw new Error('Message instance expected');
    }

    /**
     * Current message code
     *
     * @property {String} _code
     * @private
     */
    this._code = code;

    /**
     * Wrapped message object
     *
     * @property {Message} _msg
     * @private
     */
    this._msg = msg;
}

/**
 * Returns the wrapped message object
 *
 * @returns {Message}
 */
Cemi.prototype.getMessage = function() {
    return this._msg;
};

/**
 * Sets the cemi message code
 *
 * @param {String} code
 */
Cemi.prototype.setMessageCode = function(code) {
    this._code = code;
};

/**
 * Returns the current message code
 *
 * @returns {String}
 */
Cemi.prototype.getMessageCode = function() {
    return this._code;
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
 * @returns {Number} Byte
 * @private
 */
Cemi.prototype._getControlByte = function() {
    var value = 144,
        priorityValue = messagePriorities[this._msg.getPriority()];

    value |= (this._msg.isRepeated() ? 0 : 32);
    value |= (priorityValue & 3) << 2;

    return value;
};

/**
 * Returns one byte which contains the destination address flag,
 * the routing counter and the length of the transmitted data.
 *
 *     +-----+--------------+---------------+
 *     | daf |   hop count  | 0   0   0   0 |
 *     +-----+----+----+----+---+---+---+---+
 *     | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
 *     +-----+----+----+----+---+---+---+---+
 *
 * @returns {Number} DLR Byte
 * @private
 */
Cemi.prototype._getDlrByte = function() {
    var value = 0;
    value |= (this._msg.getDestination() instanceof GroupAddress) ? 128 : 0;
    value |= (this._msg.getRoutingCounter() & 7) << 4;
    return value;
};

/**
 * Returns the data information part of a cemi frame. The length of the
 * returned array depends on the telegram data information. If the
 * information is smaller than 6bits, it will be inserted to the first
 * two command bytes. Elsewhere it will be appended after the two command
 * bytes.
 *
 * @returns {Number[]} Data bytes
 * @private
 */
Cemi.prototype._getDataBytes = function() {
    var data = this._msg.getData(),
        commandValue = messageCommands[this._msg.getCommand()],
        result = [0];

    result.push(commandValue << 6);

    if (data.length === 1 && data[0] < 64) {
        result[1] = result[1] | data[0];
    } else {
        result.push.apply(result, data);
    }

    return result;
};

/**
 * Returns array of cemi bytes
 *
 * @returns {Number[]}
 */
Cemi.prototype.toArray = function() {
    var result = [],
        origin = this._msg.getOrigin(),
        destination = this._msg.getDestination(),
        dataBytes = this._getDataBytes();

    result.push(messageCodes[this._code]);
    result.push(0); // additional data length
    result.push(this._getControlByte());
    result.push(this._getDlrByte());
    result.push.apply(result, origin ? origin.getRaw() : [0, 0]);
    result.push.apply(result, destination.getRaw());
    result.push(dataBytes.length - 1);
    result.push.apply(result, dataBytes);

    return result;
};

/**
 * Parses a given buffer or array into a #Driver.KnxIp.Cemi instance
 *
 * @param  {buffer.Buffer|Array} buffer
 * @return {Driver.KnxIp.Cemi}
 * @static
 */
Cemi.parse = function(buffer) {
    var code = messageCodesInverted[buffer[0]],
        message = new Message(),
        dataLength = buffer[8],
        payload = buffer.slice(9),
        cemi;

    cemi = new Cemi(code, message);

    message.setPriority(messagePrioritiesInverted[(buffer[2] & 12) >> 2]);
    message.setRepeated((buffer[2] & 32) === 0);
    message.setRoutingCounter((buffer[3] & 112) >> 4);
    message.setOrigin(new PhysicalAddress([buffer[4], buffer[5]]));
    message.setDestination(new GroupAddress([buffer[6], buffer[7]]));

    message.setCommand(messageCommandsInverted[(payload[0] & 3) << 2 | (payload[1] & 192) >> 6]);

    if (dataLength <= 1) {
        message.setData([payload[1] & 63]);
    } else {
        message.setData(payload.slice(2));
    }

    return cemi;
};

module.exports = Cemi;