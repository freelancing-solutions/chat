// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// chat requires
const chat_utils = require('./chat-utils');
const data_store = require('./datastore');
const { response } = require("@feathersjs/express");


//****************************************************************************** */
//****************************************************************************** */
//****************************************************************************** */

// PORT Configs and Index
const PORT = process.env.PORT || 5000;




app.listen(PORT).on('listening', () => console.log(`Realtime server running on ${PORT}`));


io.on("connection", socket => {
    console.log('socket', socket);
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
