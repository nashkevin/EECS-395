var ConversationBot = require("./conversationv1");
var MarkovBot = require("./markov");

/* This bot is based on a simple Markov chain.
 * https://github.com/substack/node-markov
 */
var method = CombinedBot.prototype;

function CombinedBot(room) {
    this.room = room;
    this.markov = new MarkovBot(room, this);
	this.conversation = new ConversationBot(room, this);
	this.markMess = null;
	this.convMess = null;
}

method.chooseMess = function(mark, conv) {
    if(mark != null) {
        this.markMess = mark;
    }
    else {
        this.convMess = conv;
    }
    //if we have both messages, go ahead and choose the one to send
    if(this.markMess != null && this.convMess != null) {
        if(this.checkConfidence(this.convMess)) {
            this.room.broadcast(JSON.stringify(this.convMess.output.text).slice(2, -2), this);
        }
        else {
            this.room.broadcast(this.markMess, this);
        }
        this.markMess = null;
        this.convMess = null;
    }
}

method.checkConfidence = function(message) {
    var confLevel = 0.5; //confidence threshold

    if(message.intents[0] == null) {
        return false;
    }

    return message.intents[0].confidence > confLevel;
}

// Send a message to the bot. The sender is optional.
method.send = function(message, sender) {
    this.markov.send(message, sender, true, method.chooseMess);
	this.conversation.send(message, sender, true, method.chooseMess);
}

module.exports = CombinedBot;
