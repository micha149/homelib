var Buffer = require('buffer').Buffer;

function ConnectionRequest(client, server) {
    this.client = client;
    this.server = server;

    this.data = [
        4, // data length
        0x04, // Tunnel connection
        0x02, // Link layer
        0x00 // reserved
    ];

}

ConnectionRequest.prototype.toBuffer = function() {
    var header = new Buffer(6),
        client = this.client.toBuffer(),
        server = this.server.toBuffer(),
        data   = new Buffer(this.data),
        totalLength = header.length + client.length + server.length + data.length;

    header[0] = 0x06; // header length
    header[1] = 0x10; // protocol version (1.0)
    header[2] = 0x02; // Connect request high byte
    header[3] = 0x05; // Connect request low byte
    header[4] = (totalLength & 0xff00) >> 8;
    header[5] = totalLength & 0xff;

    return Buffer.concat([header, client, server, data], totalLength);
}

module.exports = ConnectionRequest;