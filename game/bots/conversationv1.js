var ConversationV1 = require('watson-developer-cloud/conversation/v1');

var method = ConversationBot.prototype;

function ConversationBot(room) {
    this.room = room;
    this.conversation = new ConversationV1({
        "username": "a43eee8f-6a96-40fb-a297-f99365f2c202",
        "password": "uX8MIl44vAmx",
        "version_date": '2017-02-03'
    });

    this.lastResponded = new Date().getTime();
    this.cooldownDelay = 6000; // milliseconds
}

// Send a message to the bot.
method.send = function(message) {
    // Don't respond if it's too soon after the last response.
    var now = new Date().getTime();
    if ((now-this.lastResponded) > this.cooldownDelay) {
        // Always respond if addressed. Respond 50% of the time to questions.
        // Respond 20% of the time if we haven't responded already.
        if ( (message.toLowerCase().includes(this.room.getPlayerName(this).toLowerCase()))
                || (message.includes("?") && Math.random() < 0.5)
                || Math.random() < 0.2 ) {
            this.lastResponded = new Date().getTime();
            this.respond(message);
        }
    }
}

method.respond = function(message) {
    var bot = this;
    var room = bot.room;
    setTimeout(function() {
        var answer = bot.conversation.message({
            workspace_id: 'd4c1a5ce-0485-4c20-b593-2e62b1bc5319',
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
        this.room.broadcast(message, this);
    }
}


module.exports = ConversationBot;
