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

socket.on("createUserSuccess", () => {
  console.log("succ");
});
socket.on("createUserFailed", () => {
  console.log("fail");
});
socket.on("loginSuccess", (token) => {
  console.log(token);
  myToken = token;
  socket.emit("match", myToken);
});
socket.on("loginFailed",() => {
  console.log("login failed");
});
socket.on("matchSuccess",(response)=> {
  console.log(response);
});

socket.emit("createUser","hest","1234","yes",18);
socket.emit("createUser","hest2","1234","yes",19);
socket.emit("createUser","hest3","1234","yes",20);
socket.emit("login","hest","123aaa");
socket.emit("login","hest","1234");