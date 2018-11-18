const io = require('socket.io-client')
const host = 'localhost';
const port = 3000;
var fs = require('fs');
const socket = io('http://localhost:3000');
fs.readdir('testFiles',(err, files) => {
  files.forEach(element => {
    fs.readFile(element, (err, data) => {
      if(err) throw err
      console.log(element);
      console.log(data);
      socket.emit('uploadVideo', "user2", data);
    });
  });
});