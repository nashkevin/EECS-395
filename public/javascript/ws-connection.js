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
		proceedToGame(json.playerId, json.players);
	}

	if (json.startVoting) {
		proceedToVoting();
	}

	if (json.results) {
		proceedToResults(json.results);
	}

	if (json.error) {
		alert(json.error);
	}

	if (json.roomCode) {
		document.getElementById("beforeStartRoom").classList.add("hidden");
		document.getElementById("roomInfo").classList.remove("hidden");
		document.getElementById("roomCode").innerHTML = json.roomCode;
	}

	if (json.joinedRoom) {
		document.getElementById("beforeJoinRoom").classList.add("hidden");
		document.getElementById("afterJoinRoom").classList.remove("hidden");
	}

	if (json.playerMessage) {
		var id = json.playerMessage.id;
		var message = json.playerMessage.message;
		var speechBubble = document.getElementById(id + "Message");
		speechBubble.innerHTML = message;
		var timeout = 2000 + 40 * message.length;
		setTimeout(function() { fadeBubble(speechBubble, message); }, timeout);
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

/* Function to start a game by creating a new room with friends. */
function startRoomWithFriends() {
	connect(function(e) {
		webSocket.send(JSON.stringify({ "mode": Mode.START_ROOM }));
	});
}

/* Function to join a friend's room by room code. */
function joinRoomWithFriends() {
	var code = document.getElementById("roomCode").value;
	var sendCode = function() {
		webSocket.send(JSON.stringify({ "mode": Mode.JOIN_ROOM, "roomCode": code}));
	};

	if (webSocket === undefined || webSocket.readyState === WebSocket.CLOSED) {
		// If the WebSocket isn't active yet, connect and send the code.
		connect(sendCode);
	} else {
		// If the WebSocket connection already exists, send the code.
		sendCode();
	}
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

function sendReadyToVote() {
	var ready = document.getElementById("readyToVote").checked;
	webSocket.send(JSON.stringify({ "readyToVote": ready }));
}


/* The room is ready, so proceed to the game page. Use AJAX to persist the
 * WebSocket connection. */
function proceedToGame(playerId, players) {
	var container = document.getElementById("select");

	// If the container does not exist, we've already started gameplay, in
	// which case this is function doesn't need to do anything.
	if (container) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var container = document.getElementById("select");
				container.innerHTML = xmlhttp.responseText;
				container.removeAttribute("id"); // remove old styling
				window.history.pushState(null, "", "/play"); // change URL
			}
		};
		xmlhttp.open("POST", "/game", true);
		xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xmlhttp.send("playerId=" + playerId + "&players=" + players);
	}
}

function proceedToVoting() {
	document.getElementById("game").classList.add("hidden");
	document.getElementById("voting").classList.remove("hidden");
}

function submitVotes() {
	// Manually iterate because there's no way to JSONify a FormData element
	// without using some fancy library.
	var ballot = {};
	var allInputs = document.getElementsByClassName("voteInput");
	for (var input of allInputs) {
		if (input.checked) {
			ballot[input.name] = "robot";
		} else {
			ballot[input.name] = "human";
		}
	}

	webSocket.send(JSON.stringify({ "ballot": ballot}));

	waitForVotes();
}

function waitForVotes() {
	document.getElementById("voting").classList.add("hidden");
	document.getElementById("waitForVotes").classList.remove("hidden");
}

function proceedToResults(results) {
	var invSpeed = 60;
	var i = 0;

	for (var playerId in results) {
		var votes = results[playerId];

		var extendBar = function(player, bar) {
			var vote = results[player];
			var curVal = parseFloat(document.getElementById(player + bar).style.width);
			var goalVal =  (vote[bar] / (vote["human"] + vote["robot"])) * 50;
			if(curVal + 0.1 < goalVal) {
				var nextVal = ((curVal * (invSpeed-1) + goalVal) / invSpeed) + "%";
				document.getElementById(player + bar).style.width = nextVal;
				setTimeout(extendBar, 5, player, bar);
			}
			else {
				document.getElementById(player + bar).style.width = goalVal + "%";
			}
		}

		document.getElementById(playerId + "identity").src = "/images/results/" + votes["identity"] + ".svg";
		setTimeout(extendBar, 5, playerId, "human");
		document.getElementById(playerId + "human").innerHTML = votes["human"] != 0 ? Math.floor(((votes["human"]) / (votes["human"] + votes["robot"])) * 100) + "% Human" : " ";
		setTimeout(extendBar, 5, playerId, "robot");
		document.getElementById(playerId + "robot").innerHTML = votes["robot"] != 0 ? Math.floor(((votes["robot"]) / (votes["human"] + votes["robot"])) * 100) + "% Robot" : " ";

		i++;
	}

	document.getElementById("waitForVotes").classList.add("hidden");
	document.getElementById("results").classList.remove("hidden");
}
