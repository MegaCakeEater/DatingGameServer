const io = require('socket.io-client')
const host = 'localhost';
const port = 3000;
var fs = require('fs');
var tokens = [];
var userMap = new Map();
const socket = io('http://localhost:3000');

socket.on("match", (response, gameId) => {
    console.log("match " + response);
    console.log("match2 " + gameId);

    tokens.forEach((token) => {
        socket.emit("confirmParticipation", token, gameId, true);
    });
});
socket.on("startGame", response => {
    console.log("startGame " + response);
});

socket.on("login", (response) => {
    if (tokens.push(response) == 6) {
        tokens.forEach((token) => {
            socket.emit("match", token, true);
        });
        socket.emit("match", tokens[1], false);
    }
});

socket.on("inQueue", (response) => {
    console.log("inQueue " + response);
})

socket.emit("createUser", "hest", "1234", "yes", 18);
socket.emit("createUser", "hest2", "1234", "yes", 19);
socket.emit("createUser", "hest3", "1234", "yes", 20);
socket.emit("createUser", "hest4", "1234", "yes", 21);
socket.emit("createUser", "hest5", "1234", "yes", 22);
socket.emit("createUser", "hest6", "1234", "yes", 23);

socket.emit("login", "hest", "1234");
socket.emit("login", "hest2", "1234");
socket.emit("login", "hest3", "1234");
socket.emit("login", "hest4", "1234");
socket.emit("login", "hest5", "1234");
socket.emit("login", "hest6", "1234");

/* socket.on("createUser", (response) => {
  console.log("createUser " + response);
});
socket.on("login", (token) => {
  console.log("login " + token);
  myToken = token;
  socket.emit("match", myToken);
  socket.emit("uploadFile", myToken, 1, "aaa");

  socket.emit("uploadFile", myToken, 2, "bbbb");

  socket.emit("uploadFile", myToken, 3, "ccc");

  fs.readdir('testFiles',(err, files) => {
    files.forEach(element => {
      fs.readFile(element, (err, data) => {
        if(err) throw err
        socket.emit('uploadFile', myToken, 1, data);
      });
    });
 });
});
socket.on("match", (response) => {
  console.log("match " + response);
});
socket.on("getUser", (response) => {
  console.log("getUser " + response);
});
socket.on("invalid token", () => {
  console.log("invalid token");
});
socket.on("uploadFile", (response) => {
  console.log("uploadFile " + response);
  socket.emit("getVideo", myToken, "hest", 1);
});

socket.on("getVideo", (response) => {
  console.log("getVideo " + new Buffer(response, 'base64'));
  fs.writeFile('testFiles2/README.md', new Buffer(response, 'base64'), null, (err) =>{});
});
socket.emit("createUser", "hest", "1234", "yes", 18);
socket.emit("createUser", "hest2", "1234", "yes", 19);
socket.emit("createUser", "hest3", "1234", "yes", 20);
socket.emit("login", "hest", "1234"); */