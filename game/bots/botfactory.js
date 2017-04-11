var ConversationBot = require("./conversationv1");
var MarkovBot = require("./markov");

var bots = [ConversationBot, MarkovBot];

function generateBot(room) {
    // Choose random bot from array
    var Bot = bots[Math.floor(Math.random()*bots.length)];
    return new Bot(room);
}

module.exports = {
    generate: generateBot
};
