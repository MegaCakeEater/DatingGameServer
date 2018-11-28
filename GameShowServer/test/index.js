const io = require('socket.io-client')
const host = 'localhost';
const port = 3000;
var fs = require('fs');
var myToken;
const socket = io('http://localhost:3000');

// fs.readdir('testFiles',(err, files) => {
//   files.forEach(element => {
//     fs.readFile(element, (err, data) => {
//       if(err) throw err
//       console.log(element);
//       console.log(data);
//       socket.emit('uploadVideo', "user2", data);
//     });
//   });
// });

socket.on("createUser", (response) => {
  console.log("createUser " + response);
});
socket.on("login", (token) => {
  console.log("login " + token);
  myToken = token;
  socket.emit("match", myToken);
  socket.emit("uploadFile", myToken, 1, "aaa");
});
socket.on("match",(response)=> {
  console.log("match " + response);
});
socket.on("getUser", (response)=> {
console.log("getUser " + response);
});
socket.on("invalid token",() =>{
console.log("invalid token");
});
socket.on("uploadFile", (response) => {
console.log("uploadFIle " + response);
});

socket.emit("createUser","hest","1234","yes",18);
socket.emit("createUser","hest2","1234","yes",19);
socket.emit("createUser","hest3","1234","yes",20);
socket.emit("login","hest","1234");