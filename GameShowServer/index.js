var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);


app.use(function (req, res, next) {
    console.log('middleware');
    req.testing = 'testing';
    return next();
});

app.get('/', function (req, res, next) {
    console.log('get route', req.testing);
    res.end();
});

function testMethod(callInfo, ws) {
    let returnObject = {
        id: callInfo.id,
        response: callInfo.data
    };
    ws.send(JSON.stringify(returnObject));
}


var methodArr = {};
methodArr["test"] = testMethod;

app.ws('/', function (ws, req) {
    ws.on('message', function (msg) {
        console.log(msg);
        let call = JSON.parse(msg);
        let methodToCall = call.method;
        let id = call.id;
        let response = methodArr[methodToCall](call, ws);
    });
});

app.listen(3000);
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("GameShowDatingAppDB");
    dbo.createCollection("videos", function (err, res) {
        if (err) throw err;
        console.log("Collection created!");
        dbo.collection("videos").insertOne({thing: "hest", thing2: "hest2"})
        dbo.collection("videos").findOne({thing: "hest"}).then(function (a, a2) {
            console.log(a)
            console.log(a2)
        });
        db.close();
    });
});