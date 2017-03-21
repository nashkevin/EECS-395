const url = require("url");
const WebSocket = require("ws");
var fs = require("fs"); // Node.js File System
var Transform = require("stream").Transform; // Node.js Transform stream
const util = require("util");
const Rooms = require("./rooms");

const FIVE_MEGABYTES = 5243000;

const messageHistory = "./game/bots/recentmessages.txt";

// Enum of game modes.
var Mode = {
	START_ROOM: 1,
	JOIN_ROOM: 2,
	JOIN_RANDOM: 3,
};

var wss;

/* Initializes the WebSocket on the given server. */
function start(server) {
	wss = new WebSocket.Server({ server, perMessageDeflate: false });
	wss.on("connection", onConnection);
}

/* Called when a client connects to the WebSocket. */
function onConnection(client) {
	// Set the event listeners.
	client.on('message', function(message) {onIncomingMessage(message, client)});
	client.on('close', function(code, reason) {onClose(code, reason, client)});

	client.send("Connection opened.");
}

/* Called when the server receives a message from a client. */
function onIncomingMessage(message, client) {
	try {
		// First try parsing the data as JSON.
		var json = JSON.parse(message);
		handleClientJson(client, json);
	} catch (error) {
		if (error instanceof SyntaxError) {
			// If it's not JSON, just broadcast the message.
			broadcastText(client, message);
		} else {
			// If the message was JSON, but an unrelated error happened.
			throw error;
		}
	}
}

/* Handle JSON sent from a client. */
function handleClientJson(client, json) {
	if (json.mode) {
		if (json.mode == Mode.START_ROOM) {
			startRoomWithFriends(client);
		} else if (json.mode == Mode.JOIN_ROOM) {
			joinRoomWithFriends(client, json.roomCode);
		} else if (json.mode == Mode.JOIN_RANDOM) {
			joinRandom(client);
		}
	}

	if (json.hasOwnProperty("readyToVote")) {
		Rooms.setPlayerAsReady(client, json.readyToVote);
	}

	if (json.ballot) {
		Rooms.submitBallot(client, json.ballot);
	}

	if (json.message) {
		broadcastText(client, json.message);
	}
}

/* Broadcast text to all the clients in the sender's room. */
function broadcastText(sender, message) {
	var room = Rooms.getRoomOfClient(sender);
	room.broadcast(message, sender);

	appendMessageToLog(messageHistory, message);
}

/* Called when a client closes the WebSocket connection. */
function onClose(code, reason, sender) {
    var room = Rooms.getRoomOfClient(sender);
    room.remove(sender);
    console.log("A client disconnected. Code: " + code + ". Reason: " + reason);
}

function joinRandom(client) {
	// Keep track of the newly joined client.
	var room = Rooms.getWaitingRoom();
	Rooms.addClientToRoom(client, room);
}

function startRoomWithFriends(client) {
	var code = Rooms.newRoomCode();
	var room = Rooms.getRoomByCode(code);
	Rooms.addClientToRoom(client, room);
	sendCodeToClient(code, client);
}

function sendCodeToClient(code, client) {
	var payload = {'roomCode': code};
	if (client.readyState === WebSocket.OPEN) {
		client.send(JSON.stringify(payload));
	}
}

function joinRoomWithFriends(client, roomCode) {
	if (Rooms.validCode(roomCode)) {
		var room = Rooms.getRoomByCode(roomCode);
		Rooms.addClientToRoom(client, room);
		sendJoinReceipt(client);
	} else {
		// If we can't find the room, display an error to the user.
		clientError(client, "That room does not exist.");
	}
}

// Tell the client that they have successfully joined a room.
function sendJoinReceipt(client) {
	if (client.readyState === WebSocket.OPEN) {
		client.send(JSON.stringify({"joinedRoom": true}));
	}
}

function clientError(client, message) {
	if (client.readyState === WebSocket.OPEN) {
		client.send(JSON.stringify({"error": message}));
	}
}

function appendMessageToLog(filename, message) {
	// Delete oldest messages, ten at a time
	// until the size is below an arbitrary limit
	while (fs.stat(filename).size > FIVE_MEGABYTES) {
		removeFirstLines(filename, 10);
	}

	// Append the message to the text log of recent messages
	fs.appendFile(filename, message + "\n", "utf8");
}

function removeFirstLines(filename, numLines) {
	for (var i = 0; i < numLines; i++) {
		var input = fs.createReadStream(filename);
		var output = fs.createWriteStream(filename);

		input.pipe(RemoveFirstLine()).pipe(output);
	}
}

function RemoveFirstLine(args) {
    if (! (this instanceof RemoveFirstLine)) {
        return new RemoveFirstLine(args);
    }
    Transform.call(this, args);
    this._buff = '';
    this._removed = false;
}
util.inherits(RemoveFirstLine, Transform);

RemoveFirstLine.prototype._transform = function(chunk, encoding, done) {
    if (this._removed) { // if already removed
        this.push(chunk); // just push through buffer
    } else {
        // collect string into buffer
        this._buff += chunk.toString();

        // check if string has newline symbol
        if (this._buff.indexOf('\n') !== -1) {
            // push to stream skipping first line
            this.push(this._buff.slice(this._buff.indexOf('\n') + 2));
            // clear string buffer
            this._buff = null;
            // mark as removed
            this._removed = true;
        }
    }
    done();
};


module.exports = {start: start};
