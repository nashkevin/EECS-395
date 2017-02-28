// Manages different rooms.

var Room = require("./room");

// All rooms currently active.
var rooms = new Set();
// All rooms still waiting to reach capacity.
var waitingRooms = new Set();
// Map from each client to what room they are in.
var clientToRoom = new Map();

function getRoomOfClient(client) {
    return clientToRoom.get(client);
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

function startRoom(room) {
    waitingRooms.delete(room);
    room.broadcast(JSON.stringify({'start': true}), null);
}

function addClientToRoom(client, room) {
    room.add(client);
    clientToRoom.set(client, room);
    if (room.isFull()) {
        startRoom(room);
    }
}

function removeClientFromRoom(client) {
    var room = clientToRoom.get(client);
	room.remove(client);
    clientToRoom.delete(client);
}


module.exports = {
    getRoomOfClient: getRoomOfClient,
    getWaitingRoom: getWaitingRoom,
    addClientToRoom: addClientToRoom,
    removeClientFromRoom: removeClientFromRoom
};
