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

    // Each player will receive an ID between 0 and (size-1) upon joining the
    // room. The IDs will be in random order, so that the first player to join
    // isn't always player 0.
    this._remainingPlayerIds = [];
    for (var i=0; i<this.maxSize; i++) {
        this._remainingPlayerIds.push(i);
    }
    // Shuffle. https://css-tricks.com/snippets/javascript/shuffle-array/
    this._remainingPlayerIds.sort(function() {return 0.5 - Math.random()});

    this._playerToId = new WeakMap();
}

method.add = function(player) {
    if (this.members.size < this.maxSize) {
        this.members.add(player);
        this._playerToId.set(player, this._remainingPlayerIds.pop());
    } else {
        throw new Error("Room is already full.");
    }
}

method.remove = function(player) {
    this.members.delete(player);
    this._remainingPlayerIds.push(this._playerToId.get(player));
    this._playerToId.delete(player);
}

method.isFull = function() {
    return (this.members.size >= this.maxSize);
}

method.broadcast = function(message, sender) {
    var payload = message;
    if (sender) {
        var id = this._playerToId.get(sender);
        payload = JSON.stringify({"playerMessage": {"id": id, "message": message}});
    }
    this.members.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(payload);
		}
	});
}

/* Sends a message to each client that gameplay is starting. Also tell
 * what player ID they are so they know which icon to use. */
method.signalStart = function() {
    var room = this; // "this" changes inside the loop
    this.members.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
            var obj = {'start': true, 'playerId': room._playerToId.get(client)};
			client.send(JSON.stringify(obj));
		}
	});
}

module.exports = Room;
