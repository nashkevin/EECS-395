var ConversationV1 = require('watson-developer-cloud/conversation/v1');

var method = ConversationBot.prototype;

function ConversationBot(room, parent = null) {
    this.room = room;
	this.parent = parent;
    this.conversation = new ConversationV1({
        "username": "86edc0db-baf9-4808-9a38-811e1ccc2ff7",
        "password": "6dCYs1CMCzI3",
        "version_date": '2017-02-03'
    });

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
				var name;
				if(this.parent != null) {
					name = this.parent;
				}
				else {
					name = this;
				}
        if ( (message.toLowerCase().includes(this.room.getPlayerName(name).toLowerCase()))
                || (message.includes("?") && Math.random() < 0.5)
                || Math.random() < 0.2 ) {
            this.lastResponded = new Date().getTime();
            return this.respond(message);
        }
    }
}

method.respond = function(message) {
    var bot = this;
    var room = bot.room;
    setTimeout(function() {
        var answer = bot.conversation.message({
            workspace_id: '616617a8-da40-4e0e-829a-e0d0643ab368',
            input: {'text': message},
            context: {}
        }, function(err, response) {
        		bot.handleReponse(err, response);
        })
    }, 500 + 1500 * Math.random());
}

method.handleReponse = function(err, response) {
    if (err) {
        console.log('error:', err);
    } else {
        message = JSON.stringify(response.output.text).slice(2, -2);
        if(this.parent != null) {
            this.parent.chooseMess(null, response);
        }
        else {
            this.room.broadcast(message, this);
        }
    }
}


module.exports = ConversationBot;
