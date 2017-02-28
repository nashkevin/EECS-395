// Class definition for a Room.

const WebSocket = require('ws');

var method = Room.prototype;

function Room() {
    this.members = new Set();
}

method.add = function(player) {
    this.members.add(player);
}

method.remove = function(player) {
    this.members.delete(player);
}

method.broadcast = function(sender, message) {
    this.members.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message);
		}
	});
}

module.exports = Room;
