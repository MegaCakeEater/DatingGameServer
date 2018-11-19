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
var tokenMap = {};

io.on('connection', client => {
    client.on('event', data => { /* … */
    });
    client.on('disconnect', () => { /* … */
    });
    client.on('uploadFile', (id, data) => {
        console.log(id);
        handleVideoUpload(id, data)
    });
    client.on("downloadFile", (id) => {
        console.log(id);
        getVideo("notImplemented", id, client);
    });

    client.on('login', (username, password) => {
        console.log(username);
        client.emit("login", "{'response':'success'}") //TODO skal nok gøre noget
    })


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
    mongoClient.connect(url, (err, db) => {
        if (err) throw err;
        const dbo = db.db(dbName);
        dbo.collection("videos").findOne({_id: id}, (err, result) => {
            if (err) throw err;
            console.log("found");
            db.close();
            console.log(result.binary.buffer);
            client.emit("download", result.binary.buffer);
        });
    });
}

function match(token) {

}

function login(username, password) {
//check credentials

//eliminate existing tokens if any

//generate token

//associate token with username and createtime

//return token

}

function checkToken(token) {
    //check if token is still active
}


function handleVideoUpload(id, data) {
    mongoClient.connect(url, (err, db) => {
        if (err) throw err;
        const dbo = db.db(dbName);
        dbo.collection("videos").findOne({_id: id}, (err, result) => {
            if (err) throw err;
            if (result) {
                dbo.collection("videos").update({_id: id}, {binary: data});
            } else {
                dbo.collection("videos").insertOne({_id: id, binary: data});
            }
            db.close();
        });
    });
}