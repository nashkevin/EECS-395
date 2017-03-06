// Class definition for a Room.

var ConversationV1 = require('watson-developer-cloud/conversation/v1');

var conversation = new ConversationV1({
  "username": "a43eee8f-6a96-40fb-a297-f99365f2c202",
  "password": "uX8MIl44vAmx",
	"version_date": '2017-02-03'
});

const WebSocket = require('ws');

const MAX_SIZE = 2; //TODO this is for testing
const NUM_BOTS = 1;

var method = Room.prototype;

function Room(maxSize) {
    this.members = new Set();
    // Maps from client to a boolean of whether or not they are ready.
    this.readyMap = new Map();
    if (maxSize) {
        this.maxSize = maxSize;
    } else {
        this.maxSize = MAX_SIZE;
    }

    this.numBots = NUM_BOTS;

    // Each player will receive an ID between 0 and (size-1) upon joining the
    // room. The IDs will be in random order, so that the first player to join
    // isn't always player 0.
    this._remainingPlayerIds = [];
    for (var i=0; i<this.maxSize; i++) {
        this._remainingPlayerIds.push(i);
    }
    // Shuffle. https://css-tricks.com/snippets/javascript/shuffle-array/
    this._remainingPlayerIds.sort(function() {return 0.5 - Math.random()});

    this.botIDs = [];
    for (var i=this.maxSize; i<this.maxSize + this.numBots; i++) {
        this.botIDs.push(i);
    }

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

method.broadcast = function(message, sender, botID = -1, botResponse = true) {
    var payload = message;
    if (sender) {
        var id;
        if(botID == -1) {
          id = this._playerToId.get(sender);
        }
        else {
          id = botID;
        }
        payload = JSON.stringify({"playerMessage": {"id": id, "message": message}});
    }
    this.members.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(payload);
		}
	});

  if(botResponse) {
    var bot = this.botIDs[0]; //will be replaced by the above botID
    var mems = this.members;
    setTimeout(function() {
			var answer = conversation.message({
				workspace_id: 'd4c1a5ce-0485-4c20-b593-2e62b1bc5319',
		 		input: {'text': message},
		 		context: {}
			},  function(err, response) {
			  if (err)
			    console.log('error:', err);
			  else {
					var payload = JSON.stringify({"playerMessage": {"id": bot, "message": JSON.stringify(response.output.text).slice(2, -2)}});
					mems.forEach(function each(client) {
		  		  if (client.readyState === WebSocket.OPEN) {
		  		    client.send(payload);
		  		  }
		  	  });
				}
			});
    }, 2000);
  }
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
    this.members.forEach(function each(client) {
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

module.exports = Room;
