var webSocket;

// Enum of game modes.
var Mode = {
    START_ROOM: 1,
    JOIN_ROOM: 2,
    JOIN_RANDOM: 3,
};

/* Connect to the WebSocket. Takes an event listener as argument. */
function connect(onOpen) {
	if (webSocket !== undefined && webSocket.readyState !== WebSocket.CLOSED) {
		alert("WebSocket is already opened.");
		return;
	}
	// Create a new instance of the websocket
	var url = "ws://" + window.location.host;
	webSocket = new WebSocket(url);

    // Set event listeners.
	webSocket.onopen = onOpen;
	webSocket.onmessage = onMessage;
	webSocket.onclose = onClose;
}

/* Event listener for when a message is received from the server. */
function onMessage(e) {
    try {
		// First try parsing the data as JSON.
		var json = JSON.parse(e.data);
		handleJson(json);
	} catch (error) {
		if (error instanceof SyntaxError) {
			// If it's not JSON, just broadcast the message.
			log(e.data);
		} else {
			// If the message was JSON, but an unrelated error happened.
			throw error;
		}
	}
}

/* Handles JSON from the server. */
function handleJson(json) {
    if (json.start) {
        proceedToGame();
    }

    if (json.playerMessage) {
        var id = json.playerMessage.id;
        var message = json.playerMessage.message;
        var speechBubble = document.getElementById("player" + id + "message");
        speechBubble.innerHTML = message;
        setTimeout(function() { fadeBubble(speechBubble, message); }, 2000);
    }
}

function fadeBubble(element, startingContent) {
    if (startingContent == element.innerHTML) {
        element.innerHTML = "";
    }
}

/* Event listener for when the WebSocket is closed. */
function onClose(e) {
    log("Connection closed.");
}

function log(message) {
    console.log(message);
}

/* Function to start a game by joining a random room. */
function joinRandom() {
    connect(function(e) {
        webSocket.send(JSON.stringify({ "mode": Mode.JOIN_RANDOM }));
    });
}

function sendChatMessage() {
	var message = document.getElementById("message");
	if (message.value != "") {
		webSocket.send(JSON.stringify({ "message": message.value }));
	}
    message.value = "";
}


/* The room is ready, so proceed to the game page. Use AJAX to persist the
 * WebSocket connection. */
function proceedToGame() {
    var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var container = document.getElementById("select");
            container.innerHTML = xmlhttp.responseText;
            container.removeAttribute("id"); // remove old styling
            window.history.pushState(null, "", "/play"); // change URL
		}
	};
	xmlhttp.open("GET", "/game", true);
	xmlhttp.send();
}
