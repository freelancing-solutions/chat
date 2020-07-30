'use strict';
// app main requires
const feathers = require("@feathersjs/feathers");
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

// chat requires
const chat_utils = require('./chat-utils');


//****************************************************************************** */
//****************************************************************************** */
//****************************************************************************** */

// PORT Configs and Index
const PORT = process.env.PORT || 5000;


//Servicees
// please try adding methods as services

// initializing express and feathers
const app = express(feathers());

// adding the ability to parse json
app.use(express.json());

//config socket io in realtion APIs
app.configure(socketio());

//Enable rest services
app.configure(express.rest());

// register services

// app.use('/chat', new ChatService());

// new connections connect to stream
app.on('connection', conn => app.channel('stream').join(conn));

// publish to stream
app.publish(data => app.channel('stream'));


app.listen(PORT).on('listening', () => console.log(`Realtime server running on ${PORT}`));


app.io.on("connection", socket => {
  
  chat_utils.connections.push(socket);

  // 
    
  // disconnect---here a user leaves a chat room---consider turning the user offline
  socket.on("disconnect", data => {
    chat_utils.connections.splice(chat_utils.connections.indexOf(socket), 1);
    console.log("Disconnected : %s sockets connected", chat_utils.connections.length);
  });

  // create chat room --- here a user creates a chat room---

  socket.on("create-room", data => {

  });

  // fetches room data
  socket.on("get-room",data => {

  });

  // send message----here a user actually sends a message
  socket.on("chat", data => {    
    
    chat_utils.sendMessage(data).then(results => {
      chat_utils.fetchMessages(data).then(results => app.io.sockets.emit("chat", results))      
    });
  });

  // TODO-rewrite this to broadcast only on my chat room
  socket.on("typing", data => {    
    app.io.sockets.emit("typing", data);
  });

  // here a user joins a chat meaning the user gets added to a chat room
  socket.on("join", data => {
    console.log('join message',data);
    chat_utils.joinChatRoom(data).then((results) => {
      app.io.sockets.emit("join", results);
    });
    
  });
  
  // this clears chat messages----needs to be revised
  socket.on("clear", data => {
    console.log('clear message', data);
    chat_utils.onClearMessages(data).then(results => {
      app.io.sockets.emit("chat", results);
    });    
  });

  // on populate can fetch users list and messages list
  // todo make sure it fetches users list as well
  socket.on("populate", data => {
    console.log('populate message',data);
     chat_utils.fetchMessages(data).then(results => socket.emit("populate", results));      
  });

  // this can fetch a list of users
  socket.on("users", data => {
    console.log('fetch a list of chat users',data);
    chat_utils.onFetchUsers(data).then(results => socket.emit("users", results));
  });

});

// // end of chat app
