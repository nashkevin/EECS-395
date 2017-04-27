var fs = require('fs');
var markov = require('markov');
var request = require('request');

const STATEMENTS_FILE = __dirname + '/statements.txt';
// If STATEMENTS_FILE does not exist, we can use this high-quality content.
const DEFAULT_SEED = 'https://raw.githubusercontent.com/zanchi/random-bee-movie/master/text';

/* This bot is based on a simple Markov chain.
 * https://github.com/substack/node-markov
 */
var method = MarkovBot.prototype;

function MarkovBot(room, parent = null) {
    this.room = room;
	this.parent = parent;

    this.markov = markov(Math.floor(Math.random() * 5));

    // Add at least a minimum amount of text because the Markov library doesn't
    // like empty seeds at all.
    this.markov.seed('beep beep detective');
    // Add user-created statements to the seed.
    if (fs.existsSync(STATEMENTS_FILE)) {
        var seed = fs.createReadStream(STATEMENTS_FILE);
        this.markov.seed(seed);
    } else {
        // If the statements file does not exist, try and get a seed from online.
        var that = this;
        request.get(DEFAULT_SEED, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                that.markov.seed(body);
            }
        });
    }

    this.lastResponded = new Date().getTime();
    this.cooldownDelay = 6000; // milliseconds
}

// Send a message to the bot. The sender is optional.
method.send = function(message, sender) {
    // Learn from everyone else in the room. This learns from other bots, too,
    // but we don't know who's a human or who's a bot at this point, so it
    // would be mean to discriminate!
    if (sender !== null) {
        this.markov.seed(message);
    }

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
				that.parent.chooseMess(that.markov.respond(message, 1+Math.floor(Math.random() * 9)).join(' '), null);
			}
        }, timeout);
    }
}

method.sendResponse = function(message) {
    try {
        var response = this.markov.respond(message, 1+Math.floor(Math.random() * 9)).join(' ');
        this.room.broadcast(response, this);
    } catch (error) {
        // This Markov library sometimes throws "TypeError: Cannot read property
        // 'words' of undefined". It seems to only happen when the seed is very small.
        console.error(error);
    }
}

module.exports = MarkovBot;
