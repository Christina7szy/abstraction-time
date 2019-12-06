const express = require("express");
const app = express();
const Twit = require("twit");
const Sentiment = require("sentiment");

const config = require("./config.js");

const T = new Twit(config);
const sentiment = new Sentiment();

// const nyc = ['-73.9833', '40.6898', '-73.978', '40.695'];

const nyc = "[-73.9833, 40.6898, -73.978, 40.695]";

// const stream = T.stream('statuses/filter', { locations: nyc });
app.use("/assets", express.static("./assets/"));

app.get("/", (req, res) => {
  res.sendFile("./index.html", { root: __dirname });
  // res.send(sample);
});

var clientId = 0;
var clients = {}; // <- Keep a map of attached clients

// Called once for each new client. Note, this response is left open!
app.get("/events/", function(req, res) {
  req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream", // <- Important headers
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.write("\n");
  (function(clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function() {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
  })(++clientId);
});

// setInterval(function() {
//   var msg = Math.random();
//   console.log('Clients: ' + Object.keys(clients) + ' <- ' + msg);
//   for (clientId in clients) {
//     clients[clientId].write('data: ' + msg + '\n\n'); // <- Push a message to a single attached client
//   }
// }, 2000);

setInterval(function() {
  T.get(
    "search/tweets",
    { q: "New York since:2011-07-11", count: 10 },
    function(err, data, response) {
      const sample = [];
      const tweets = data.statuses;
      const tweetTotal = tweets.length;
      for (let i = 0; i < tweetTotal; i++) {
        const tweet = tweets[i].text;
        const result = sentiment.analyze(tweet);
        const { score } = result;
        const bigScore = score * 10;
        sample.push(bigScore);
      }
      // setInterval(function() {
      for (clientId in clients) {
        clients[clientId].write("data: " + JSON.stringify(sample) + "\n\n"); // <- Push a message to a single attached client
      }
      // }, 30000);
      console.log(sample);
    }
  );
}, 10000);

app.listen(process.env.PORT || 8080);
