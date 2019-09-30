'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const uuidv4 = require('uuid/v4');

const PORT = process.env.PORT || 5000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);


let users = [];
let connections = [];
let messages = [];

const prepareMessage = async data => {
    data.timestamp = Date.now();
    data.message_id = uuidv4();
    console.log(data);  
    messages.push(data); 
    console.log("Previous messages", messages);  
    return messages;
};

const onClearMessages = async data => {
    // check to see if the user is an admin
    // then clear messages
    messages = [];
    return messages;
};

io.on("connection", socket => {
  
  connections.push(socket);
    
  // disconnect
  socket.on("disconnect", data => {
    connections.splice(connections.indexOf(socket), 1);
    console.log("Disconnected : %s sockets connected", connections.length);
  });

  // send message

  socket.on("chat", data => {
    prepareMessage(data).then( results => {
      io.sockets.emit("chat", results);
    }).catch(error => {
      io.sockets.emit("chat", data);
    });    
  });

  socket.on("typing", data => {
    socket.broadcast.emit("typing", data);
  });
    
  socket.on("join", data => {
    socket.emit("join",data);
    users.push(data);  
  });
  
  socket.on("clear", data => {
    onClearMessages(data).then(results => {
      io.sockets.emit("chat", results);
    });    
  })
});



// end of chat app
