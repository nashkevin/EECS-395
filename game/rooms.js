// Manages different rooms.

var Room = require("./room");

// All rooms still waiting to reach capacity.
var waitingRooms = new Set();
// Map of all rooms that are joinable by code.
var codeToRoom = new Map();
// Map from each client to what room they are in.
var clientToRoom = new Map();

function newRoomCode() {
    var room = new Room();
    var code = generateCode();
    codeToRoom.set(code, room);
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
    return codeToRoom.get(code);
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
    waitingRooms.delete(room);
    room.signalStart();
}

function addClientToRoom(client, room) {
    room.add(client);
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


module.exports = {
    newRoomCode: newRoomCode,
    getRoomByCode: getRoomByCode,
    getRoomOfClient: getRoomOfClient,
    getWaitingRoom: getWaitingRoom,
    addClientToRoom: addClientToRoom,
    removeClientFromRoom: removeClientFromRoom
};
