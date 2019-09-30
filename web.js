'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const uuidv4 = require('uuid/v4');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);


let users = [];
let connections = [];
let messages = [];


io.on("connection", socket => {
  
  connections.push(socket);
    
  // disconnect
  socket.on("disconnect", data => {
    connections.splice(connections.indexOf(socket), 1);
    console.log("Disconnected : %s sockets connected", connections.length);
  });

  // send message

  socket.on("chat", data => {
    data.timestamp = Date.now();
    data.message_id = uuidv4();
    console.log(data);  
    io.sockets.emit("chat", data);
    messages.push(data); 
    console.log('Previous messages',messages);  
  });

  socket.on("typing", data => {
    socket.broadcast.emit("typing", data);
  });
    
  socket.on("join", data => {
    socket.emit("join",data);
    users.push(data);  
  })    
});



// end of chat app
