// Class definition for a Room.

var ConversationBot = require("./bots/conversationv1");

const WebSocket = require('ws');

// Numbers of players (humans + robots)
const MAX_SIZE = 3; //TODO this value is for testing.

var method = Room.prototype;

function Room(maxSize) {
    // Set of WebSockets corresponding to human players.
    this.humans = new Set();
    // Maps from client to a boolean of whether or not they are ready to vote.
    this.readyMap = new Map();

    // Set of all bots. Each bot should have a "send" method that takes a string
    // and delivers it to the bot. The bot should send messages by calling
    // "broadcast" on this room.
    this.bots = new Set();

    // The maximum size for the room (humans + bots).
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
    this._idToPlayer = new Map();

    // Maps from player to ballot. Ballots are maps from player IDs (as strings
    // because JSON attributes are strings) to the string "human" or "robot".
    this._ballots = new Map();
}

method.playerCount = function() {
    return this.humans.size + this.bots.size;
}

method.addHuman = function(human) {
    if (!this.isFull()) {
        this.humans.add(human);
        var id = this._remainingPlayerIds.pop();
        this._playerToId.set(human, id);
        this._idToPlayer.set(id, human);

        //TODO this is an overly simplistic method of balancing humans and bots.
        // Make it more sophisticated.
        if (!this.isFull()) {
            this.addBot(new ConversationBot(this));
        }
    } else {
        throw new Error("Room is already full.");
    }
}

method.addBot = function(bot) {
    if (!this.isFull()) {
        this.bots.add(bot);
        var id = this._remainingPlayerIds.pop();
        this._playerToId.set(bot, id);
        this._idToPlayer.set(id, bot);
    } else {
        console.log("Room is already full, so bot will not be added.");
    }
}

method.remove = function(player) {
    if (this.humans.has(player)) {
        this.humans.delete(player);
    } else {
        this.bots.delete(player);
    }
    var id = this._playerToId.get(player);
    this._remainingPlayerIds.push(id);
    this._playerToId.delete(player);
    this._idToPlayer.delete(id);
}

method.isFull = function() {
    return (this.playerCount() >= this.maxSize);
}

method.broadcast = function(message, sender) {
    var payload = message;
    if (sender) {
        id = this._playerToId.get(sender);
        payload = JSON.stringify({"playerMessage": {"id": id, "message": message}});
    }
    this.humans.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(payload);
		}
	});

    this.bots.forEach(function each(bot) {
        if (sender != bot) { // do not message self
            bot.send(payload);
        }
    });
}

/* Sends a message to each client that gameplay is starting. Also tell
 * what player ID they are so they know which icon to use. */
method.signalStart = function() {
    var room = this; // "this" changes inside the loop
    this.humans.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
            var obj = {'start': true, 'playerId': room._playerToId.get(client)};
			client.send(JSON.stringify(obj));
		}
	});
}

/* Mark a player as ready to vote. */
method.setPlayerAsReady = function(client, isReady) {
    this.readyMap.set(client, isReady);
    if (this.isReadyToVote()) {
        this.signalVote();
    }
}

method.isReadyToVote = function() {
    // If every member is ready to vote, return true. False otherwise.
    var readyMap = this.readyMap;
    var ready = true;
    this.humans.forEach(function each(client) {
		if (!readyMap.has(client) || !readyMap.get(client)) {
            ready = false;
        }
	});
    return ready;
}

/* Broadcast to each player that we are ready to vote. */
method.signalVote = function() {
    this.broadcast(JSON.stringify({'startVoting': true}));
}

method.submitBallot = function(client, ballot) {
    this._ballots.set(client, ballot);
    if (this.everyoneHasVoted()) {
        this.broadcastResults();
    }
}

method.everyoneHasVoted = function() {
    var ballots = this._ballots;
    var ready = true;
    this.humans.forEach(function each(client) {
		if (!ballots.has(client)) {
            ready = false;
        }
	});
    return ready;
}

method.broadcastResults = function() {
    var payload = JSON.stringify({"results": this.tallyVotes()});
    this.humans.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(payload);
		}
	});
}

method.tallyVotes = function() {
    // Initialize the object of votes.
    var results = {};
    for (var id of this._idToPlayer.keys()) {
        results[id] = {"human": 0, "robot": 0}; // vote count

        if (this.humans.has(this._idToPlayer.get(id))) {
            results[id]["identity"] = "human";
        } else {
            results[id]["identity"] = "robot";
        }
    }

    for (var ballot of this._ballots.values()) {
        for (var playerIdStr in ballot) {
            var playerId = parseInt(playerIdStr);
            var guess = ballot[playerIdStr];
            if (guess == "human" || guess == "robot") {
                results[playerId][guess]++;
            }
        }
    }

    return results;
}

module.exports = Room;
