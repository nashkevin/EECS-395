// Manages different rooms.

var Room = require("./room");

// All rooms still waiting to reach capacity.
var waitingRooms = new Set();
// Map of all rooms that are joinable by code.
var codeToRoom = new Map();
var roomToCode = new Map();
// Map from each client to what room they are in.
var clientToRoom = new Map();

function newRoomCode() {
    var room = new Room();
    var code = generateCode();
    codeToRoom.set(code, room);
    roomToCode.set(room, code);
    return code;
}

// Generate a random room code that is not already in use.
function generateCode() {
    var code;
    do {
        // Generates a random 4-digit number in the range [1000, 9999].
        code = Math.floor(Math.random() * 9000) + 1000;
    } while (codeToRoom.has(code));
    return code;
}

function getRoomByCode(code) {
    return codeToRoom.get(parseInt(code));
}

function isValidCode(code) {
    return codeToRoom.has(parseInt(code));
}

function getRoomOfClient(client) {
    return clientToRoom.get(client);
}

/* Returns a room that is not full yet and still looking for players. */
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

/* Broadcasts a signal to all clients that the room is full and gameplay can begin. */
function startGameplay(room) {
    // Remove the room from any lists of pending rooms.
    waitingRooms.delete(room);
    if (roomToCode.has(room)) {
        var code = roomToCode.get(room);
        roomToCode.delete(room);
        codeToRoom.delete(code);
    }

    room.signalStart();
}

function addClientToRoom(client, room) {
    room.addHuman(client);
    clientToRoom.set(client, room);
    if (room.isFull()) {
        startGameplay(room);
    }
}

function removeClientFromRoom(client) {
    var room = clientToRoom.get(client);
	room.remove(client);
    clientToRoom.delete(client);
}

/* Mark the player as ready to vote. */
function setPlayerAsReady(client, isReady) {
    var room = clientToRoom.get(client);
    room.setPlayerAsReady(client, isReady);
}


module.exports = {
    newRoomCode: newRoomCode,
    getRoomByCode: getRoomByCode,
    validCode: isValidCode,
    getRoomOfClient: getRoomOfClient,
    getWaitingRoom: getWaitingRoom,
    addClientToRoom: addClientToRoom,
    removeClientFromRoom: removeClientFromRoom,
    setPlayerAsReady: setPlayerAsReady
};
