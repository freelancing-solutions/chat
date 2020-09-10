'use strict';
// app main requires
const feathers = require("@feathersjs/feathers");
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

// chat requires
const chat_utils = require('./chat-utils');
const data_store = require('./datastore');



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
  /**
   * 
   *    
   * message_id = ndb.StringProperty()
    chat_id = ndb.StringProperty()
    uid = ndb.StringProperty()
    message = ndb.StringProperty()
    timestamp = ndb.IntegerProperty() # in millisecond
    attachments = ndb.StringProperty()
    archived = ndb.BooleanProperty(default=False)

   */
  socket.on("chat", data => {        
    console.log('chat ', data);
    data_store.onSendMessage(data).then(response => {
      console.log('send message response ', response);
      if (response.status){
        data_store.onFetchMessages(response.payload.chat_id).then(response => {
          console.log('fetch messages response', response);
          if (response.status){
            socket.broadcast.emit("chat", response.payload)
          }
        }).catch(error => {

        })
      }
    }).catch(error => {

    });
    
  });

  // TODO-rewrite this to broadcast only on my chat room
  socket.on("typing", data => {
        // use socket to emit the typing message to everyone presently dont work though
        console.log('typing', data);
    socket.broadcast.emit("typing", data);
  });

  // here a user joins a chat meaning the user gets added to a chat room
  socket.on("join", data => {
    const results = {status: false, payload : {}, error: {}}
    console.log('calling join with', data);
    data_store.onJoinChatRoom(data,data.chat_id).then(response => {      
      socket.broadcast.emit("join", response);
    }).catch(error => {
        results.status = false;
        results.error = {message: 'there was an error joining chat room'}
        socket.emit("join", results);
    });
    
  });
  
  // this clears chat messages----needs to be revised
  socket.on("clear", data => {
    
    // TODO- to be implemented or soon to be deprecated
  });

  // on populate can fetch users list and messages list
  // todo make sure it fetches users list as well
  socket.on("populate", data => {
     const results = {status: true, payload : {users: [], messages : []}, error:{}} 
     console.log('populate', data);
     data_store.onFetchUsers(data.chat_id).then(response => {
       if(response.status){         
         results.payload.users = [...response.payload]
         data_store.onFetchMessages(data.chat_id).then(response => {
           if(response.status){             
             results.payload.messages = [...response.payload]
             results.status = true;
             socket.emit("populate", results)
           }
         }).catch(error => {

         })      
       }
     }).catch(error => {

     })     
  });

  // this can fetch a list of users
  socket.on("users", data => {
    console.log('fetch a list of chat users',data);
    data_store.onFetchUsers(data.chat_id).then(response =>{
      if (response.status){
        socket.emit("users", response)
      }
    }).catch(error => {

    })

});


})
// // end of chat app
