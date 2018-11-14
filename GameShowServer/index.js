const server = require('http').createServer();
const io = require('socket.io')(server);
io.on('connection', client => {
  client.on('event', data => { /* … */ });
  client.on('disconnect', () => { /* … */ });
});
server.listen(3000);

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("GameShowDatingAppDB");
  dbo.createCollection("videos", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    dbo.collection("videos").insertOne({thing:"hest", thing2:"hest2"})
    dbo.collection("videos").findOne({thing:"hest"}).then(function(a,a2) {
      console.log(a)
      console.log(a2)
    });
  db.close();
});
});