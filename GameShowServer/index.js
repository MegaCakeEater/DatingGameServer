const server = require('http').createServer();
const io = require('socket.io')(server);
const port = 3000;
const dbName = "GameShowDatingAppDB";
const mongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const tokenMap = new Map();
const judgerQueue = [];
const nonJudgerQueue = []; //TODO: hvad fuck kalder vi lige deltagerne?
const judgersNeededToPlay = 5;
const nonJudgersNeededToPlay = 1;



io.on('connection', client => {
  client.on('event', data => { //do nothing
  });
  client.on('disconnect', () => { //do nothing
  });
  client.on("uploadFile", (token, roundnumber, data) => {
    console.log("asd");
    handleVideoUpload(token, roundnumber, data, client)
  });
  client.on("getVideo", (token, username, roundNumber) => {
    getVideo(token, username, roundNumber, client);
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
  client.on("match", (token, judger) => {
    match(token, judger, client);
  });
  client.on("updateBiography", (token, bio) => {
    updateBiography(token, bio, client);
  });
  client.on("updateProfilePicture", (token, pic) => {
    updateProfilePicture(token, pic, client);
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


function getVideo(token, username, roundNumber, client) {
  if (!checkToken(token, client)) return;
  mongoClient.connect(url, (err, db) => {
    if (err) {
      db.close();
      client.emit("getVideo", "failure");
      return;
    }
    const dbo = db.db(dbName);
    let round = "round" + roundNumber;

    dbo.collection("videos").findOne({ _id: username }, { fields: { _id: 0, [round]: 1 } }, (err, result) => {
      if (err) {
        db.close();
        client.emit("getVideo", "failure");
        return;
      }
      db.close();
      client.emit("getVideo", result[round]);
    });
  });
}

function match(token, judger, client) {
  if (!checkToken(token, client)) return;
  //TODO: DET BURDE VIRKE SÅDAN HER, MEN MAN KAN IKKE TESTE MED KUN EN KLIENT SÅ
  /* if (judger) {
    if (!judgerQueue.includes(client)) judgerQueue.push(client);
    client.emit("inQueue", "success");
  } else {
    if (!nonJudgerQueue.includes(client)) nonJudgerQueue.push(client);
    client.emit("inQueue", "success");
  } */
  if (judger) {
    judgerQueue.push(client);
    client.emit("inQueue", "success");
  } else {
    nonJudgerQueue.push(client);
    client.emit("inQueue", "success");
  }
  
  if(canPlay()) {
    startGame();
  }
}

function canPlay() {
  return nonJudgerQueue.length >= nonJudgersNeededToPlay && judgerQueue.length >= judgersNeededToPlay;
}

function startGame() {
  const judgers = judgerQueue.splice(0, judgersNeededToPlay);
  const nonJudgers = nonJudgerQueue.splice(0, nonJudgersNeededToPlay);

  judgers.forEach((judger) => {
    judger.emit("match", "success");
  });
  nonJudgers.forEach((nonJudger) => {
    nonJudger.emit("match", "success");
  });
}

function generateUUID() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function login(username, password, client) {
  mongoClient.connect(url, (err, db) => {
    if (err) {
      client.emit("login", "failure");
      db.close();
      return;
    }
    const dbo = db.db(dbName);
    dbo.collection("users").findOne({ _id: username, password: password }, (err, result) => {
      if (err) {
        client.emit("login", "failure");
        db.close();
        return;
      }
      else if (result != null) {
        let token = generateUUID();
        tokenMap.set(token, username);
        client.emit("login", token);
      } else {
        client.emit("login", "failure");
      }
      db.close();
    });
  });
}

function checkToken(token, client) {
  if (!tokenMap.has(token)) {
    console.log("token fail");
    client.emit("invalid token");
    return false;
  }
  return true;
}


function handleVideoUpload(token, roundNumber, data, client) {
  if (!checkToken(token, client)) return;
  mongoClient.connect(url, (err, db) => {
    let username = tokenMap.get(token);
    if (err) {
      db.close();
      client.emit("uploadFile", "failure");
      return;
    }
    const dbo = db.db(dbName);
    let round = "round" + roundNumber;
    dbo.collection("videos").updateOne({ _id: username }, { $set: { [round]: data } }, { upsert: true });
    db.close();
    client.emit("uploadFile", "success");
  });
}

function createUser(username, password, sex, age, client) {
  mongoClient.connect(url, (err, db) => {
    if (err) {
      client.emit("createUser", "failure");
      db.close();
      return;
    }
    const dbo = db.db(dbName);
    dbo.collection("users").insertOne({ _id: username, password: password, sex: sex, age: age, biography: "", profilePicture: null },
      (err, result) => {
        if (err) {
          client.emit("createUser", "failure");
          db.close();
          return;
        }
        client.emit("createUser", "success");
      });
    db.close();
  });
}

function updateBiography(token, bio, client) {
  if (!checkToken(token, client)) return;
  let username = tokenMap.get(token);
  mongoClient.connect(url, (err, db) => {
    if (err) {
      client.emit("updateBiography", "failure");
      db.close();
      return;
    }
    const dbo = db.db(dbName);
    dbo.collection("users").updateOne({ username: username }, { $set: { biography: bio } },
      (err, result) => {
        if (err) {
          db.close();
          client.emit("updateBiography", "failure");
          return;
        }
      });
    db.close();
    client.emit("updateBiography", "success");
  });
}

function updateProfilePicture(token, pic, client) {
  if (!checkToken(token, client)) return;
  let username = tokenMap.get(token);
  mongoClient.connect(url, (err, db) => {
    if (err) {
      db.close();
      client.emit("updateProfilePicture", "failure");
      return;
    }
    const dbo = db.db(dbName);
    dbo.collection("users").updateOne({ username: username }, { $set: { profilePicture: pic } },
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
  if (!checkToken(token, client)) return;
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