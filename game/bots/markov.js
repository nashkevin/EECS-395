var fs = require('fs');
var markov = require('markov');

/* This bot is based on a simple Markov chain.
 * https://github.com/substack/node-markov
 */
var method = MarkovBot.prototype;

function MarkovBot(room, parent = null) {
    this.room = room;
	this.parent = parent;

    this.markov = markov(Math.floor(Math.random() * 5));

    var seed = fs.createReadStream(__dirname + '/statements.txt');
    this.markov.seed(seed);

    this.lastResponded = new Date().getTime();
    this.cooldownDelay = 6000; // milliseconds
}

// Send a message to the bot. The sender is optional.
method.send = function(message, sender) {
    // Don't respond if it's too soon after the last response.
    var now = new Date().getTime();
    if ((now-this.lastResponded) > this.cooldownDelay) {
        var key = this.markov.search(message);
				var name;
				if(this.parent != null) {
					name = this.parent;
				}
				else {
					name = this;
				}
        if (message.toLowerCase().includes(this.room.getPlayerName(name).toLowerCase())) {
            this.respondWithProbability(message, 0.95);
        } else if (typeof key !== undefined) {
            // If there's a key, the Markov chain hopefully has a better response.
            return this.respondWithProbability(message, 0.6);
        } else {
            return this.respondWithProbability(message, 0.3);
        }
    }
}

method.respondWithProbability = function(message, probability) {
    if (Math.random() < probability) {
        this.lastResponded = new Date().getTime();
        var timeout = 1000 + Math.random() * 4000;
        var that = this;
        setTimeout(function () {
			if(that.parent == null) {
		        that.sendResponse(message);
			}
			else {
				that.parent.chooseMess("test", null);
			}
        }, timeout);
    }
}

method.sendResponse = function(message) {
    var response = this.markov.respond(message, 1+Math.floor(Math.random() * 9)).join(' ');
    this.room.broadcast(response, this);
}

module.exports = MarkovBot;
