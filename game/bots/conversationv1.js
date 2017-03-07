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
    // Always responds.
    var bot = this;
    var room = bot.room;
    setTimeout(function() {
        var answer = bot.conversation.message({
            workspace_id: 'd4c1a5ce-0485-4c20-b593-2e62b1bc5319',
            input: {'text': message},
            context: {}
        }, function(err, response) {
            bot.respond(err, response);
        })
      }, 2000);
}

method.respond = function(err, response) {
    // As far as I know, I need to pass in the bot explicitly because "this"
    // is a different object for whatever reason.

    if (err) {
        console.log('error:', err);
    } else {
        message = JSON.stringify(response.output.text).slice(2, -2);
        this.room.broadcast(message, this);
    }
}


module.exports = ConversationBot;