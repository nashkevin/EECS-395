var ConversationV1 = require('watson-developer-cloud/conversation/v1');

var method = ConversationBot.prototype;

function ConversationBot(room) {
    this.room = room;
    this.conversation = new ConversationV1({
        "username": "a43eee8f-6a96-40fb-a297-f99365f2c202",
        "password": "uX8MIl44vAmx",
        "version_date": '2017-02-03'
    });
}

// Send a message to the bot.
method.send = function(message) {
    // Respond 90% of the time to questions or 50% of the time otherwise.
    if ((message.includes("?") && Math.random() < 0.9) || Math.random() < 0.5) {
        this.respond(message);
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
    }, 1000 + 1500 * Math.random());
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
