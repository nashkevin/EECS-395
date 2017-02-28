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

// Set of sockets to clients.
var room = new Room();

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
	room.broadcast(sender, message);
}

/* Called when a client closes the WebSocket connection. */
function onClose(code, reason, client) {
	room.remove(client);
}

function joinRandom(client) {
    // Keep track of the newly joined client.
	room.add(client);
    client.send(JSON.stringify({'start': true}));
}


module.exports = {start: start};
