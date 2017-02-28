// Class definition for a Room.

const WebSocket = require('ws');

const MAX_SIZE = 2; //TODO this is for testing

var method = Room.prototype;

function Room(maxSize) {
    this.members = new Set();
    if (maxSize) {
        this.maxSize = maxSize;
    } else {
        this.maxSize = MAX_SIZE;
    }
}

method.add = function(player) {
    if (this.members.size < this.maxSize) {
        this.members.add(player);
    } else {
        throw new Error("Room is already full.");
    }
}

method.remove = function(player) {
    this.members.delete(player);
}

method.isFull = function() {
    return (this.members.size >= this.maxSize);
}

method.broadcast = function(message, sender) {

    this.members.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message);
		}
	});
}

module.exports = Room;
