const io = require('socket.io-client')
const host = 'localhost';
const port = 3000;
var fs = require('fs');
const socket = io('http://localhost:3000');
socket.on("createUserSuccess", () => {
  console.log("succ");
});
socket.on("createUserFailed", () => {
  console.log("fail");
});
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
socket.emit("createUser","token","hest","1234","yes",18);