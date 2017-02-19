var webSocket;
var messages = document.getElementById("chat");

function addMessageToChat(text) {
	messages.innerHTML += "<br/>" + text;
	messages.scrollTop = messages.scrollHeight;
}

function joinGame() {
	if (webSocket !== undefined && webSocket.readyState !== WebSocket.CLOSED) {
		addMessageToChat("WebSocket is already opened.");
		return;
	}
	// Create a new instance of the websocket
	var url = "ws://" + window.location.host;
	webSocket = new WebSocket(url);

	/** Binds functions to the listeners for the websocket */
	webSocket.onopen = function(e) {
		if (e.data === undefined){
			return;
		}
		addMessageToChat(e.data);
	};

	/** Handle messages that are received from the server */
	webSocket.onmessage = function(e) {
		addMessageToChat(e.data);
	};

	/** Handle closing the connection */
	webSocket.onclose = function(e) {
		addMessageToChat("Connection closed.");
	};
}


function sendChatMessage() {
	var text = document.getElementById("chatInput").value;
	document.getElementById("chatInput").value = "";
	if (text != "") {
		webSocket.send(text);
	}
}

window.onload = joinGame