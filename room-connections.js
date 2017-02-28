const url = require('url');
const WebSocket = require('ws');

var wss;

// Set of sockets to clients.
var room = new Set();

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

	// Keep track of the newly joined client.
	room.add(client);

	client.send('Connection opened.');
}

/* Called when the server receives a message from a client. */
function onIncomingMessage(message, sendingClient) {
	// Broadcast the echoed message
	room.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message);
		}
	});
}

/* Called when a client closes the WebSocket connection. */
function onClose(code, reason, client) {
	room.delete(client);
}



module.exports = {start: start};
