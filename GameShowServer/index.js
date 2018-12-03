'use strict';
const server = require('http').createServer();
const io = require('socket.io')({
    path: '',
    serveClient: false,
  });
io.attach(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  });
const port = 3001;
const dbName = "GameShowDatingAppDB";
const mongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const tokenMap = new Map();
const clientMap = new Map();
var judgerQueue = [];
var nonJudgerQueue = [];
const judgersNeededToPlay = 2;
const nonJudgersNeededToPlay = 1;
const activeGames = new Map();
const unconfirmedGames = new Map();
const totalRounds = 3;
const picDir = 'files/pictures';
const videoDir = 'files/videos';
var fs = require('fs');

io.on('connection', client => {
    client.on('event', data => { //do nothing
        console.log("event " + data);
    });
    client.on('disconnect', () => { //do nothing
        console.log("disconnect");
    });
    client.on("uploadFile", (token, roundnumber, data) => {
        console.log("uploadFile " + token + " " + roundnumber);
        handleVideoUpload(token, roundnumber, data, client)
    });
    client.on("getVideo", (token, username, roundNumber) => {
        console.log("getVideo " + token + " " + username + " " + roundNumber);
        getVideo(token, username, roundNumber, client);
    });
    client.on("createUser", (username, password, sex, age) => {
        console.log("createUser " + username + " " + password + " " + sex + " " + age);
        createUser(username, password, sex, age, client);
    });
    client.on("getUser", (token, username) => {
        console.log("getUser " + token + " " + username);
        getUser(token, username, client);
    });
    client.on("login", (username, password) => {
        console.log("login " + username + " " + password);
        login(username, password, client);
    });
    client.on("match", (token, judger) => {
        console.log("match " + token + " " + judger);
        match(token, judger, client);
    });
    client.on("confirmParticipation", (token, gameId, response) => {
        console.log("confirmPartcipation " + token + " " + gameId + " " + response);
        confirmParticipation(token, gameId, response, client);
    });
    client.on("updateBiography", (token, bio) => {
        console.log("updateBiography " + token + " " + bio);
        updateBiography(token, bio, client);
    });
    client.on("updateProfilePicture", (token, pic) => {
        console.log("updateProfilePicture " + token);
        updateProfilePicture(token, pic, client);
    });
    client.on("vote", (token, gameId, timeStamp) => {
        console.log("vote " + token + " " + gameId + " " + timeStamp);
        vote(token, gameId, timeStamp, client);
    });
    client.on("comment", (token, gameId, comment,timeStamp) => {
        console.log("comment " + token + " " + gameId + " " + comment);
            comments(token, gameId, comment, timeStamp, client);
    });
    client.on("getComment", (token, username) => {
        console.log("getComment " + token + " " + username);
        getComments(token, gameId, comment, timeStamp, client);
    });

    client.on("videoOver", (token, gameId) => {
        console.log("videoOver " + token + " " + gameId);
        videoOver(token, gameId, client);
    });
    client.on("getMessages", (token) => {
        console.log("getMessage " + token);
        getMessages(token, client);
    });
    client.on("sendMessage", (token, receiver, message, timestamp) => {
        console.log("sendMessage " + token + " " + receiver + " " + message + " " + timestamp);
        sendMessage(token, receiver, message, timestamp, client);
    });
    client.on('error', err => {
        console.log("error " + err);
    });
    client.on('connecting', conn => {
        console.log("connecting " + conn);
    });
    client.on('connect_failed', err => {
        console.log("connect failed " +err);
    });
    client.on('message', message => {
        console.log("message " + message);
    });
    client.on('reconnect', recon => {
        console.log("reconnect " + recon);
    });
    client.on('reconnecting', recon => {
        console.log("reconnecting " + recon);
    });
    client.on('reconnect_failed', err => {
        console.log("reconnect failed " + err);
    });
});
server.listen(port);

mongoClient.connect(url, (err, db) => {
    if (err) {
        console.log(err);
        return;
    }
    var dbo = db.db(dbName);
    dbo.createCollection("videos", function (err, res) {
        if (err) {
            console.log(err);
            return;
        }
    });
});


function match(token, judger, client) {
    if (!checkToken(token, client)) return;
    var player = { client: client, username: tokenMap.get(token), confirmed: false, hasWatched: false };
    judgerQueue = judgerQueue.filter(queuedPlayer => {
        return queuedPlayer.username != player.username;
    });
    nonJudgerQueue = nonJudgerQueue.filter(queuedPlayer => {
        return queuedPlayer.username != player.username;
    });
    if (judger) {
        judgerQueue.push(player);
        client.emit("inQueue", "success");
    } else {
        nonJudgerQueue.push(player);
        client.emit("inQueue", "success");
    }
    if (canPlay()) {
        requestGame();
    }
}

function canPlay() {
    return nonJudgerQueue.length >= nonJudgersNeededToPlay && judgerQueue.length >= judgersNeededToPlay;
}

function requestGame() {
    const gameId = generateUUID();
    const judgers = judgerQueue.splice(0, judgersNeededToPlay);
    const nonJudgers = nonJudgerQueue.splice(0, nonJudgersNeededToPlay);

    judgers.forEach((judger) => {
        judger.client.emit("match", gameId);
    });
    nonJudgers.forEach((nonJudger) => {
        nonJudger.client.emit("match", gameId);
    });

    let game = { judgers: judgers, nonJudgers: nonJudgers, round: 1 };
    unconfirmedGames.set(gameId, game);
}

function confirmParticipation(token, gameId, reponse, client) {
    if (!checkToken(token, client)) return;
    const username = tokenMap.get(token);
    const game = unconfirmedGames.get(gameId);
    if (game == null) {
        return;
    }
    if (reponse == false) {
        unconfirmedGames.delete(gameId);
        game.judgers.forEach((judger) => {
            if (judger.username != username) judgerQueue.unshift(judger);
        });
        game.nonJudgers.forEach((nonJudger) => {
            if (nonJudger.username != username) nonJudgerQueue.unshift(nonJudger);
        });
    } else {
        game.judgers.forEach((judger) => {
            if (judger.username == username) {
                judger.confirmed = true;
            }
        });
        game.nonJudgers.forEach((nonJudger) => {
            if (nonJudger.username == username) {
                nonJudger.confirmed = true;
            }
        });
        if (checkGameCanStart(game)) {
            activeGames.set(gameId, game);
            unconfirmedGames.delete(gameId);
            startGame(game, gameId);
        }
    }
}

function startGame(game, gameId) {
    console.log(gameId + " starting");
    game.judgers.forEach(judger => {
        game.nonJudgers.forEach(nonJudger => {
            judger.client.emit("startGame", gameId, game.judgers.length, nonJudger.username);
        });
    });
    game.nonJudgers.forEach(nonJudger => {
        nonJudger.client.emit("startGame", gameId, game.judgers.length, nonJudger.username);
    });
}

function checkGameCanStart(game) {
    var judgersReady = game.judgers.filter((judger) => {
        return judger.confirmed;
    }).length;
    var nonJudgersReady = game.nonJudgers.filter((nonJudger) => {
        return nonJudger.confirmed;
    }).length;
    return judgersReady === judgersNeededToPlay && nonJudgersReady === nonJudgersNeededToPlay;
}

function vote(token, gameId, timeStamp, client) { //TODO: database til timestamp
    if (!checkToken(token, client)) return;
    const game = activeGames.get(gameId);
    const username = tokenMap.get(token);
    if (game == null) {
        return;
    }
    game.judgers = game.judgers.filter((judger) => judger.username !== username);
    if (game.judgers.length === 0) {
        game.nonJudgers.forEach(nonJudger => {
            nonJudger.client.emit("gameOver");
        });
    } else {
        game.judgers.forEach(judger => {
            judger.client.emit("gameUpdate", game.judgers.length, judgersNeededToPlay, game.round);
        });
        game.nonJudgers.forEach(nonJudger => {
            nonJudger.client.emit("gameUpdate", game.judgers.length, judgersNeededToPlay, game.round);
        });
    }
}

function getComments(token, user, client) {
    if (!checkToken(token, client)) return;
    mongoClient.connect(url, (err, db) => {
        if (err) {
            console.log(err);
            db.close();
            client.emit("getComments", "failure");
            return;
        }
        const dbo = db.db(dbName);
        dbo.collection("comments").find({ to: user } , (err, result) => {
            if (err || result == null) {
                console.log(err);
                db.close();
                client.emit("getComments", "failure");
                return;
            }
            db.close();
            result.toArray().then(messages => client.emit("getComments", messages));
        });
    });
}

function comments(token, gameId, comment, timeStamp, client) { //TODO: gem de her comments
    console.log("comment " + comment);
    mongoClient.connect(url, (err, db) => {
        if (err) {
            console.log(err);
            db.close();
            client.emit("comment", "failure");
            return;
        }

        const dbo = db.db(dbName);

        const game = activeGames.get(gameId);
        const commentObj = {
            text: comment,
            timestamp: timeStamp,
            from: clientMap.get(client),
            to: game.username,
            video: game.round
        };

        game.nonJudgers.forEach(nonJudger => {
            dbo.collection("comments").insertOne({username: nonJudger.username, comment: commentObj}, (err, result) => {
                if (err) {
                    console.log(err);
                    db.close();
                    client.emit("comment", "failure");
                    return;
                }
            });
        });
        db.close();
        client.emit("comment", "success");
    });


}

function videoOver(token, gameId, client) {
    if (!checkToken(token, client)) return;
    var username = tokenMap.get(token);
    var game = activeGames.get(gameId);
    game.judgers.forEach((judger) => {
        if (judger.username = username) judger.hasWatched = true;
    });

    if (canGoToNextRound(game)) {
        startNextRound(game);
    }
}

function canGoToNextRound(game) {
    return game.judgers.every(judge => judge.hasWatched);
}

function startNextRound(game) {
    game.round++;
    if (checkGameOver(game)) {
        handleGameOver(game);
    }
    game.judgers.forEach(judger => {
        judger.hasWatched = false;
        judger.client.emit("gameUpdate", game.judgers, judgersNeededToPlay, game.round);
    });
    game.nonJudgers.forEach(nonJudger => {
        nonJudger.client.emit("gameUpdate", game.judgers, judgersNeededToPlay, game.round);
    });
}

function handleGameOver(game) {
    game.judgers.forEach(judger => {
        judger.client.emit("gameOver");
    });
    game.nonJudgers.forEach(nonJudger => {
        nonJudger.emit("gameOver", game.judgers.map(judger => judger.username));
        /*    game.judgers.forEach(judger => {
                nonJudger.client.emit("gameOver", judger.username);
            });*/
    });
}

function checkGameOver(game) {
    return game.round > totalRounds;
}

function generateUUID() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function login(username, password, client) {
    mongoClient.connect(url, (err, db) => {
        if (err) {
            console.log(err);
            client.emit("login", "failure");
            db.close();
            return;
        }
        const dbo = db.db(dbName);
        dbo.collection("users").findOne({ _id: username, password: password }, (err, result) => {
            if (err) {
                console.log(err);
                client.emit("login", "failure");
                db.close();
                return;
            }
            else if (result != null) {
                tokenMap.forEach((value, key, a)=> {
                    if(value == username) {
                        tokenMap.delete(key);
                    }
                });
                let token = generateUUID();
                var client2 = clientMap.get(username);
                if(client2 != null) {
                    client2.disconnect();
                }
                clientMap.set(username, client);
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
    console.log("checkToken " + token);
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
            console.log(err);
            db.close();
            client.emit("uploadFile", "failure");
            return;
        }
        const dbo = db.db(dbName);
        writeFile(videoDir, username + roundNumber, data);
        dbo.collection("videos").updateOne({ username: username, roundNumber: roundNumber }, { $set: { video : username + roundNumber } }, { upsert: true });
        db.close();
        client.emit("uploadFile", "success");
    });
}

function getVideo(token, username, roundNumber, client) {
    if (!checkToken(token, client)) return;
    mongoClient.connect(url, (err, db) => {
        if (err) {
            console.log(err);
            db.close();
            client.emit("getVideo", "failure");
            return;
        }
        const dbo = db.db(dbName);
        dbo.collection("videos").findOne({ username: username, roundNumber: roundNumber}, (err, result) => {
            if (err || result == null) {
                if (err) console.log(err);
                db.close();
                client.emit("getVideo", "failure");
                return;
            }
            if (result.video != null) {
                getFile(videoDir, result.video, (data => {
                    client.emit("getVideo", {video:data.buffer});
                }));
            } else {
                client.emit("getVideo", "failure");
            }
            db.close();
        });
    });
}

function getFile(dir, filename, callback) {
    console.log(dir +'/' +filename);
    fs.readFile(dir +'/' +filename,(err, data) => {
        callback(data);
    });
}

function writeFile(dir, filename, content) {
    
    fs.writeFileSync(require('path').resolve(dir +'/',filename), new Buffer(content, 'base64'), null, (err) => {
        console.log(err);
    });
}

function createUser(username, password, sex, age, client) {
    mongoClient.connect(url, (err, db) => {
        if (err) {
            console.log(err);
            client.emit("createUser", "failure");
            db.close();
            return;
        }
        const dbo = db.db(dbName);
        dbo.collection("users").insertOne({
            _id: username,
            password: password,
            sex: sex,
            age: age,
            biography: null,
            profilePicture: null
        },
            (err, result) => {
                if (err) {
                    console.log(err);
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
            console.log(err);
            client.emit("updateBiography", "failure");
            db.close();
            return;
        }
        const dbo = db.db(dbName);
        dbo.collection("users").updateOne({ _id: username }, { $set: { biography: bio } },
            (err, result) => {
                if (err) {
                    console.log(err);
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
            console.log(err);
            db.close();
            client.emit("updateProfilePicture", "failure");
            return;
        }
        const dbo = db.db(dbName);
        writeFile(picDir, username, pic);
        dbo.collection("users").updateOne({ _id: username }, { $set: { profilePicture: username } },
            (err, result) => {
                if (err) {
                    console.log(err);
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
            console.log(err);
            db.close();
            client.emit("getUser", "failure");
            return;
        }
        const dbo = db.db(dbName);
        dbo.collection("users").findOne({ _id: user }, (err, result) => {
            if (err || result == null) {
                console.log(err);
                db.close();
                client.emit("getUser", "failure");
                return;
            }

            getFile(picDir, result.profilePicture, data => {
                result.profilePicture = data;
                client.emit("getUser", result);
                db.close();
            });
        });
    });
}

function getMessages(token, client) {
    if (!checkToken(token, client)) return;
    var username = tokenMap.get(token);
    mongoClient.connect(url, (err, db) => {
        if (err) {
            console.log(err);
            db.close();
            client.emit("getMessages", "failure");
            return;
        }
        const dbo = db.db(dbName);
        dbo.collection("messages").find({ $or: [{ sender: username }, { reciever: username }] }, (err, result) => {
            if (err) {
                console.log(err);
                db.close();
                client.emit("getMessages", "failure");
                return;
            }
            result.toArray().then(messages => client.emit("getMessages", messages));
        });
    });
}

function sendMessage(token, reciever, message, timestamp, client) {
    if (!checkToken(token, client)) return;
    var sender = tokenMap.get(token);
    var messageToSend = { sender: sender, reciever: reciever, message: message, timestamp: timestamp };
    mongoClient.connect(url, (err, db) => {
        if (err) {
            console.log(err);
            db.close();
            client.emit("sendMessage", "failure");
            return;
        }
        const dbo = db.db(dbName);
        dbo.collection("messages").insertOne(messageToSend, (err, result) => {
            if (err) {
                console.log(err);
                db.close();
                client.emit("sendMessage", "failure");
                return;
            }
            db.close();
            client.emit("sendMessage", "success");
            if (clientMap.has(reciever) && clientMap.get(reciever).connected) {
                clientMap.get(reciever).emit("messageRecieved", messageToSend);
            }
        });
    });
}