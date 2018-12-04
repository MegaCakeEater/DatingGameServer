const io = require('socket.io-client')
const host = 'localhost';
const port = 3001;
var fs = require('fs');
var tokens = [];
var userMap = new Map();
const socket = io('http://localhost:3001');

/* socket.on("match", (response, gameId) => {
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
*/

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
socket.on("messageRecieved", (message) => {
    console.log("messageRecieved " + message);
});
socket.on("getMessages", (response) => {
    console.log("getMessages " + response.forEach(message => console.log(message)));
});
socket.on("sendMessage", (response) => {
    console.log("sendMessage " + response);
});

socket.on("getVideo", (response) => {
    console.log("getVideo ");
    console.log(response);
    fs.writeFile('testFiles2/hest.mp4', new Buffer(response, 'base64'), null, (err) => { });
});

socket.on("createUser", (response) => {
    console.log("createUser " + response);
});
socket.on("getUser", response => {
    console.log(response);
});
socket.on("login", (token) => {
    myToken = token;
    tokens.push(token);
        socket.emit("comment", token, "b", "asdasdasdas", 1000, 1);
    /* socket.emit("updateBiography",token,"hest23");
    socket.emit("getUser",token, "hest23");
    socket.emit("match", myToken); */
    /*   socket.emit("uploadFile", myToken, 1, "aaa");
    
      socket.emit("uploadFile", myToken, 2, "bbbb");
    
      socket.emit("uploadFile", myToken, 3, "ccc");
     */
    /* fs.readdir('testFiles',(err, files) => {
      files.forEach(element => {
        fs.readFile(element, (err, data) => {
          if(err) throw err
          socket.emit('uploadFile', myToken, 1, data);
        });
      });
   }); */
});
//socket.emit("createUser", "hest", "1234", "yes", 18);
socket.emit("login", "hest", "1234");