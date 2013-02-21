/**
 * Object representation for a group address. An instance can be created with
 * a serializes group address. This address will be stored as 2 bytes and can
 * be used to build a bus telegram.
 * Each group address needs a datatype instance for validating data before
 * sending. An optional title can be stored for organization purposes.
 */
var PhysicalAddress = function(address) {
    if (!address) {
        throw new Error('Missing address parameter');
    }
    
    this.address = address;
}

PhysicalAddress.prototype.getRaw = function() {
    return [0x9b, 0x00];
}

module.exports = PhysicalAddress;