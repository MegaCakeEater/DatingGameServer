/* så der er et par design ting vi lige skal have fundet ud af
   i forhold til hvordan interaktionen mellem klient og server skal fungere,
   hvilke ting der skal håndteres af serveren
   vi skal også have aftalt en data model.
   Jeg har high-level skitseret de metoder, jeg går ud fra SKAL være der.
*/

const server = require('http').createServer();
const io = require('socket.io')(server);
const port = 3000;
const dbName = "GameShowDatingAppDB";
const mongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
let tokenMap = new Map();

io.on('connection', client => {
  client.on('event', data => { //do nothing
  });
  client.on('disconnect', () => { //do nothing
  });
  client.on("uploadFile", (id, data) => {
    console.log(id);
    handleVideoUpload(id, data, client)
  });
  client.on("downloadFile", (id, token) => {
    console.log(id);
    getVideo(token, id, client);
  });
  client.on("createUser", (username, password, sex, age) => {
    console.log("createUser " + username + " " + password + " " + sex + " " + age);
    createUser(username, password, sex, age, client);
  });
  client.on("getUser", (token, username) => {
    console.log("getUser " + token + " " + user);
    getUser(token, username);
  });

  client.on("login", (username, password) => {
    console.log(username);
    login(username, password, client);
  });
  client.on("match", (token) => {
    match(token, client);
  });
  client.on("updateBiography", (token, bio) => { //todo
    updateBiography(token, bio);
  });
  client.on("updateProfilePicture", (token, pic) => { //todo
    updateProfilePicture(token, pic);
  });
});
server.listen(port);

mongoClient.connect(url, (err, db) => {
  if (err) throw err;
  var dbo = db.db(dbName);
  dbo.createCollection("videos", function (err, res) {
    if (err) throw err;
  });
});


function getVideo(token, id /*userId, roundNumber*/, client) {//TODO jeg ved ikke om det ikke er nemmere, at klienten har videonavn, i forhold til userid og roundnumber
  checkToken(token, client)
  mongoClient.connect(url, (err, db) => {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.collection("videos").findOne({ _id: id }, (err, result) => {
      if (err) throw err;
      db.close();
      client.emit("download", result.binary.buffer);
    });
  });
}

function match(token, client) {
  checkToken(token, client);
  client.emit("matchSuccess", "aaahaahaha");
}

function generateUUID() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function login(username, password, client) {
  mongoClient.connect(url, (err, db) => {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.collection("users").findOne({ _username: username, _password: password }, (err, result) => {
      if (err) client.emit("loginFailed");
      db.close();
      let token = generateUUID();
      tokenMap.set(token, username);
      client.emit("loginSuccess", token);
    });
  });
}

function checkToken(token, client) {
  if (!tokenMap.has(token)) {
    client.emit("invalid token");
    throw new Error("invalid token");
  }
}


function handleVideoUpload(token, roundNumber, data, client) {
  mongoClient.connect(url, (err, db) => {
    checkToken(token, client);
    let username = tokenMap.get(token);
    if (err) {
      client.emit("uploadFailure");
      throw err;
    }
    const dbo = db.db(dbName);
    dbo.collection("videos").update({ username: username, roundNumber: roundNumber }, { video: data }, { upsert: true });
    db.close();
    client.emit("uploadSuccess");
  });
}

function createUser(username, password, sex, age, client) {
  mongoClient.connect(url, (err, db) => {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.collection("users").insertOne({ username: username, password: password, sex: sex, age: age, biography: "", profilePicture: null },
      (err, result) => {
        if (err) client.emit("createUserFailed");
        client.emit("createUserSuccess");
      });
    db.close();
  });
}

function updateBiography(token, bio) {
  checkToken(token);
  let username = tokenMap.get(token);
  mongoClient.connect(url, (err, db) => {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.collection("users").updateOne({ username: username }, { biography: bio },
      (err, result) => {
        if (err) client.emit("updateBiographyFailed");
        client.emit("updateBiographySuccess");
      });
    db.close();
  });
}

function updateProfilePicture(token, pic) {
  checkToken(token);
  let username = tokenMap.get(token);
  mongoClient.connect(url, (err, db) => {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.collection("users").updateOne({ username: username }, { profilePicture: pic },
      (err, result) => {
        if (err) {
          client.emit("updateProfilePictureFailed");
          throw err;
        }
        client.emit("updateProfilePictureSuccess");
      });
    db.close();
  });
}

function getUser(token, user, client) {
  checkToken(token);
  mongoClient.connect(url, (err, db) => {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.collection("users").findOne({ _username: user }, (err, result) => {
      if (err) client.emit("getUserFailed");
      db.close();
      client.emit("getUserSuccess", result);
    });
  });
}