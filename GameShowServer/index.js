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


function getVideo(token, username, roundnumber , client) {
  checkToken(token, client)
  mongoClient.connect(url, (err, db) => {
    if (err) {
      db.close();
      client.emit("getVideoFailed");
      throw err;
    }
    const dbo = db.db(dbName);
    dbo.collection("videos").findOne({ username: username, roundNumber:roundnumber }, (err, result) => {
      if (err) {
        db.close();
        client.emit("getVideoFailed");
        throw err;
      }
      db.close();
      client.emit("getVideoSucces", result.binary.buffer);
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
    if (err) {
      client.emit("login");
      db.close();
      throw err;
    } 
    const dbo = db.db(dbName);
    dbo.collection("users").findOne({ username: username, password: password }, (err, result) => {
      if (err) {
        client.emit("login");
        db.close();
        throw err;
      }
      db.close();
      if(result) {
        let token = generateUUID();
        tokenMap.set(token, username);
        client.emit("login", token);
      } else {
        client.emit("login");
      }
      db.close();
    });
  });
}

function checkToken(token, client) {

  console.log(token);
  console.log(tokenMap);
  console.log(!tokenMap.has(token));
  if (!tokenMap.has(token)) {
    console.log("tockenajdsj");
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
      db.close();
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
        if (err) {
          client.emit("register",false);
          db.close();
          throw err;
        }
        client.emit("register",true);
      });
    db.close();
  });
}

function updateBiography(token, bio) {
  checkToken(token);
  let username = tokenMap.get(token);
  mongoClient.connect(url, (err, db) => {
    if (err) {
      client.emit("updateBiographyFailed");
      db.close();
      throw err;
    } 
    const dbo = db.db(dbName);
    dbo.collection("users").updateOne({ username: username }, { biography: bio },
      (err, result) => {
        if (err) {
          db.close();
          client.emit("updateBiographyFailed");
          throw err;
        } 
      });
    db.close();
    client.emit("updateBiographySuccess");
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
          db.close();
          client.emit("updateProfilePictureFailed");
          throw err;
        }
      });
    db.close();
    client.emit("updateProfilePictureSuccess");
  });
}

function getUser(token, user, client) {
  checkToken(token);
  mongoClient.connect(url, (err, db) => {
    if (err) {
      db.close();
      client.emit("getUserFailed");
      throw err;
    }
    const dbo = db.db(dbName);
    dbo.collection("users").findOne({ _username: user }, (err, result) => {
      if (err) {
        db.close();
        client.emit("getUserFailed");
        throw err;
      }
      db.close();
      client.emit("getUserSuccess", result);
    });
  });
}