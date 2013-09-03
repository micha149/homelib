var util = require('util'),
    Packet = require('./Packet.js'),
    Buffer = require('buffer').Buffer;

/**
 * A connection request is a knx ip packet which is sent to the ip interface
 * for initializing a connection between the interface and the client. It contains
 * the data and connection endpoint on which the ip interface will send further
 * packages. The interface should respond to the request with a
 * {@link Driver.KnxIp.ConnectionResponse ConnectionResponse}.
 *
 * @class Driver.KnxIp.ConnectionRequest
 * @extend Driver.KnxIp.Packet
 * @constructor
 * @param {Driver.KnxIp.Hpai} client Connection endpoint
 * @param {Driver.KnxIp.Hpai} server Data endpoint
 */
function ConnectionRequest(client, server) {
    this._client = client;
    this._server = server;

    this._data = [
        4, // data length
        0x04, // Tunnel connection
        0x02, // Link layer
        0x00 // reserved
    ];
    this._serviceType = 0x0205;
}
util.inherits(ConnectionRequest, Packet);

/**
 * Returns packet data bytes
 *
 * @returns {Array}
 */
ConnectionRequest.prototype.getData = function() {
    var client = this._client.toArray(),
        server = this._server.toArray(),
        data = this._data;

    return client.concat(server, data);
};

module.exports = ConnectionRequest;