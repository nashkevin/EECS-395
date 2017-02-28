const url = require('url');
const WebSocket = require('ws');

function start(server) {
	const wss = new WebSocket.Server({ server, perMessageDeflate: false });
	wss.on('connection', function connection(ws) {
		const location = url.parse(ws.upgradeReq.url, true);

		// On message received from client
		ws.on('message', function incoming(message) {
			// Broadcast the echoed message
			wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(message);
				}
			});
		});

		// When each client first connects
		ws.send('Connection opened.');
	});
}



module.exports = {start: start};
