const io = require('socket.io-client')
const host = 'localhost';
const port = 3000;
var fs = require('fs');
var myToken;
const socket = io('http://localhost:3000');


socket.on("createUser", (response) => {
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
socket.emit("login", "hest", "1234");