var fs = require('fs');
var markov = require('markov');

/* This bot is based on a simple Markov chain. */
var method = MarkovBot.prototype;

function MarkovBot(room) {
    this.room = room;

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
        // Always respond if addressed. Respond 50% of the time to questions.
        // Respond 20% of the time if we haven't responded already.
        if ( (message.toLowerCase().includes(this.room.getPlayerName(this).toLowerCase()))
                || (message.includes("?") && Math.random() < 0.5)
                || Math.random() < 0.2 ) {
            this.lastResponded = new Date().getTime();

            var timeout = 1000 + Math.random() * 4000;
            var that = this;
            setTimeout(function () {
                that.respond(message);
            }, timeout);
        }
    }
}

method.respond = function(message) {
    var response = this.markov.respond(message, 1+Math.floor(Math.random() * 9)).join(' ');
    this.room.broadcast(response, this);
}

module.exports = MarkovBot;
