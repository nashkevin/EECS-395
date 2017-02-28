const url = require('url');
const WebSocket = require('ws');

var wss;

/* Initializes the WebSocket on the given server. */
function start(server) {
	wss = new WebSocket.Server({ server, perMessageDeflate: false });
	wss.on('connection', onConnection);
}

/* Called when a client connects to the WebSocket. */
function onConnection(ws) {
	const location = url.parse(ws.upgradeReq.url, true);

	// On message received from client
	ws.on('message', onIncomingMessage);

	// When each client first connects
	ws.send('Connection opened.');
}

/* Called when the server receives a message from a client. */
function onIncomingMessage(message) {
	// Broadcast the echoed message
	wss.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message);
		}
	});
}



module.exports = {start: start};
