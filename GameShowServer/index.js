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
  client.on("downloadFile", (token, username, roundnumber) => {
    console.log(token);
    getVideo(token, token, username, roundnumber, client);
  });
  client.on("createUser", (username, password, sex, age) => {
    console.log("createUser " + username + " " + password + " " + sex + " " + age);
    createUser(username, password, sex, age, client);
  });
  client.on("getUser", (token, username) => {
    getUser(token, username, client);
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
  if (err) return;
  var dbo = db.db(dbName);
  dbo.createCollection("videos", function (err, res) {
    if (err) return;
  });
});


function getVideo(token, username, roundnumber , client) {
  if(!checkToken(token, client)) return;
  mongoClient.connect(url, (err, db) => {
    if (err) {
      db.close();
      client.emit("getVideo","failure");
      return;
    }
    const dbo = db.db(dbName);
    let round = "round"+roundnumber;
    dbo.collection("videos").findOne({ _id: username}, (err, result) => {
      if (err) {
        db.close();
        client.emit("getVideo","failure");
        return;
      }
      db.close();
      client.emit("getVideo", result.round.binary.buffer);
    });
  });
}

function match(token, client) {
  if(!checkToken(token, client)) return;
  client.emit("match", "success");
}

function generateUUID() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function login(username, password, client) {
  mongoClient.connect(url, (err, db) => {
    if (err) {
      client.emit("login","failure");
      db.close();
      return;
    } 
    const dbo = db.db(dbName);
    dbo.collection("users").findOne({ _id: username, password: password }, (err, result) => {
      if (err) {
        client.emit("login","failure");
        db.close();
        return;
      }
      db.close();
      if(result) {
        let token = generateUUID();
        tokenMap.set(token, username);
        client.emit("login", token);
      } else {
        client.emit("login","failure");
      }
      db.close();
    });
  });
}

function checkToken(token, client, callback) {
  if (!tokenMap.has(token)) {
    client.emit("invalid token");
    return false;
  }
  return true;
}


function handleVideoUpload(token, roundNumber, data, client) {
  if(!checkToken(token, client)) return;
  mongoClient.connect(url, (err, db) => {
    let username = tokenMap.get(token);
    if (err) {
      client.emit("uploadFile","failure");
      db.close();
      return;
    }
    const dbo = db.db(dbName);
    let round ="round"+roundNumber;
    dbo.collection("videos").update({ _id: username}, { round: data }, { upsert: true });
    db.close();
    client.emit("uploadFile","success");
  });
}

function createUser(username, password, sex, age, client) {
  mongoClient.connect(url, (err, db) => {
    if (err) {
      client.emit("createUser","failure");
      db.close();
      return;
    }
    const dbo = db.db(dbName);
    dbo.collection("users").insertOne({ _id: username, password: password, sex: sex, age: age, biography: "", profilePicture: null },
      (err, result) => {
        if (err) {
          client.emit("createUser","failure");
          db.close();
          return;
        }
        client.emit("createUser","success");
      });
    db.close();
  });
}

function updateBiography(token, bio) {
  if(!checkToken(token, client)) return;
  let username = tokenMap.get(token);
  mongoClient.connect(url, (err, db) => {
    if (err) {
      client.emit("updateBiography","failure");
      db.close();
      return;
    } 
    const dbo = db.db(dbName);
    dbo.collection("users").updateOne({ username: username }, { biography: bio },
      (err, result) => {
        if (err) {
          db.close();
          client.emit("updateBiography","failure");
          return;
        } 
      });
    db.close();
    client.emit("updateBiography","success");
  });
}

function updateProfilePicture(token, pic) {
  if(!checkToken(token, client)) return;
  let username = tokenMap.get(token);
  mongoClient.connect(url, (err, db) => {
    if (err) {
      db.close();
      client.emit("updateProfilePicture", "failure");
      return;
    } 
    const dbo = db.db(dbName);
    dbo.collection("users").updateOne({ username: username }, { profilePicture: pic },
      (err, result) => {
        if (err) {
          db.close();
          client.emit("updateProfilePicture", "failure");
          return;
        }
      });
    db.close();
    client.emit("updateProfilePicture", "success");
  });
}

function getUser(token, user, client) {
  if(!checkToken(token, client)) return;
  mongoClient.connect(url, (err, db) => {
    if (err) {
      db.close();
      client.emit("getUser", "failure");
      return;
    }
    const dbo = db.db(dbName);
    dbo.collection("users").findOne({ _id: user }, (err, result) => {
      if (err) {
        db.close();
        client.emit("getUser", "failure");
        return;
      }
      db.close();
      client.emit("getUser", result);
    });
  });
}