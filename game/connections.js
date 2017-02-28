const url = require('url');
const WebSocket = require('ws');

var Room = require("./room");

// Enum of game modes.
var Mode = {
    START_ROOM: 1,
    JOIN_ROOM: 2,
    JOIN_RANDOM: 3,
};

var wss;

// All rooms currently in use.
var rooms = new Set();
// All rooms still waiting to reach capacity.
var waitingRooms = new Set();
// Map from each client to what room they are in.
var clientToRoom = new WeakMap();

/* Initializes the WebSocket on the given server. */
function start(server) {
	wss = new WebSocket.Server({ server, perMessageDeflate: false });
	wss.on('connection', onConnection);
}

/* Called when a client connects to the WebSocket. */
function onConnection(client) {
	// Set the event listeners.
	client.on('message', function(message) {onIncomingMessage(message, client)});
	client.on('close', function(message) {onClose(message, client)});

	client.send('Connection opened.');
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
            //TODO
		} else if (json.mode == Mode.JOIN_ROOM) {
            //TODO
		} else if (json.mode == Mode.JOIN_RANDOM) {
            joinRandom(client);
		}
	}

	if (json.message) {
		broadcastText(client, json.message);
	}
}

/* Broadcast text to all the clients in the sender's room. */
function broadcastText(sender, message) {
    var room = clientToRoom.get(sender);
	room.broadcast(message, sender);
}

/* Called when a client closes the WebSocket connection. */
function onClose(code, reason, client) {
	room.remove(client);
    clientToRoom.delete(client);
}

function joinRandom(client) {
    // Keep track of the newly joined client.
    var room = getWaitingRoom();
	room.add(client);
    clientToRoom.set(client, room);
    if (room.isFull()) {
        startRoom(room);
    }
}

function startRoom(room) {
    waitingRooms.delete(room);
    room.broadcast(JSON.stringify({'start': true}), null);
}

function getWaitingRoom() {
    //TODO is there a potential for race conditions?
    if (waitingRooms.size == 0) {
        // Make a new room.
        var room = new Room();
        waitingRooms.add(room);
        return room;
    } else {
        // Return a random room.
        return [...waitingRooms][Math.floor(Math.random()*waitingRooms.size)];
    }
}


module.exports = {start: start};
