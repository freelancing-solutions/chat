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
    
  // disconnect
  socket.on("disconnect", data => {
    chat_utils.connections.splice(chat_utils.connections.indexOf(socket), 1);
    console.log("Disconnected : %s sockets connected", chat_utils.connections.length);
  });

  // send message
  socket.on("chat", data => {    
    chat_utils.prepareMessage(data).then(results => {
      app.io.sockets.emit("chat", results);
    });
  });

  socket.on("typing", data => {
    socket.broadcast.emit("typing", data);
  });
    
  socket.on("join", data => {
    console.log('join message',data);
    chat_utils.userJoinedChat(data).then(results => {
      app.io.sockets.emit("join", results);
    });
    
  });
  
  socket.on("clear", data => {
    console.log('clear message', data);
    chat_utils.onClearMessages(data).then(results => {
      app.io.sockets.emit("chat", results);
    });    
  });

  socket.on("populate", data => {
    console.log('populate message',data);
     chat_utils.onPopulate(data).then(results => socket.emit("populate", results));      
  });

});

// // end of chat app
