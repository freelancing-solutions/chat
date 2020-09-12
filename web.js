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

/****
 *
 * Default Messages
 */

const user_joined_chat = (uid,socket) => {
    const message = {
            message_id : `${uid}485345`,
            chat_id : "p-m",
            uid : `${uid}`,
            message : "....just joined chat",
            timestamp : Date.now(),
            attachments : [],
            archived : false
        };
    const results = {status : true, payload : {message:{...message}}, error: {}};
    socket.broadcast.emit("chat", results);
};


const user_left_chat = (uid,socket) => {
    const message = {
            message_id : `${uid}485345`,
            chat_id : "p-m",
            uid : `${uid}`,
            message : "i left chat goodbye",
            timestamp : Date.now(),
            attachments : [],
            archived : false
        };
    const results = {status : true, payload : {message:{...message}}, error: {}};
    socket.broadcast.emit("chat", results);
};

const error_on_server_message = (uid,socket, error) => {
    const message = {
            message_id : `${uid}485345`,
            chat_id : "p-m",
            uid : `${uid}`,
            message : `server error : ${error.message} please inform admin about this`,
            timestamp : Date.now(),
            attachments : [],
            archived : false
        };
    const results = {status : true, payload : {message:{...message}}, error: {}};
    socket.emit("chat", results);
};

app.use((socket, next) => {
    let uid = socket.handshake.query.token;
    if (uid === ''){
        return next(new Error('cannot accept null token'));
    }

    if (chat_utils.connections.find(uid)){
        return next(new Error('already connected'))
    }

    chat_utils.connections.push(uid);

    return next();
});

/***
 * starting server
 */
app.listen(PORT).on('listening', () => console.log(`Realtime server running on ${PORT}`));

/***
 * ap io listening for events
 ***/

app.io.on("connection", socket => {
    
    let uid = socket.handshake.query.token;

  // disconnect---here a user leaves a chat room---consider turning the user offline
  socket.on("disconnect", data => {
    chat_utils.connections.splice(chat_utils.connections.indexOf(uid), 1);
  });

  // create chat room --- here a user creates a chat room---

  socket.on("create-room", data => {

  });

  // fetches room data
  socket.on("get-room",data => {
        //get-room should work
  });


  /**
   *  on chat is where users actually sends chat messages
   *
   *
   * */
  socket.on("chat", data => {
    const results = {status : true, payload : {message : {}, user : {}}, error : {}}
    results.payload = {...data.payload};
    data_store.onSendMessage(data.payload.message).then(response => {
      console.log('send message response ', response);
      if (response.status){
            results.payload.message = {...response.payload};
            socket.broadcast.emit("chat", results);
            socket.emit("chat", results);
      }
    }).catch(error => {
      error_on_server_message(uid,socket,error);
    });
    
  });


  /***
     * on typing is where users gets status updates
   ***/
  socket.on("typing", data => {
        // use socket to emit the typing message to everyone presently dont work though
        const results = {status : true, payload : {typing : {} , user : {}}, error: {}};
        data.payload.typing.timestamp = Date.now();
        data.payload.user.last_online = Date.now();
        results.payload = {...data.payload};        
        // get user from users list on the chat app
        socket.broadcast.emit("typing", results);

  });

  /**
   *
   * on join is where users joins a chat room
   *
  ***/
  socket.on("join", data => {

    data_store.onJoinChatRoom(data,data.chat_id).then(response => {
      if (response.status){
        socket.broadcast.emit("join", response);
      }else{
          error_on_server_message(uid,socket,{message: 'unable to join chat-room'});
      }
    }).catch(error => {
        error_on_server_message(uid,socket,error);
    });
    
  });

   /***
     * clears chat room messages can only be accessed by admins
   ***/
  socket.on("clear", data => {
    
    // TODO- to be implemented or soon to be deprecated
  });

  // on populate can fetch users list and messages list
  // todo make sure it fetches users list as well
  socket.on("populate", data => {
     const results = {status: true, payload : {users: [], messages : []}, error:{}};
     console.log('populate', data);
     // consider adding user information on chat room
     data_store.onJoinChatRoom(data,data.chat_id).then(response => {
         console.log('response', response);
       if (response.status){
          data_store.onFetchUsers(data.chat_id).then(response => {
              console.log('users : ',response);
            if(response.status){         
              results.payload.users = [...response.payload];
      
              data_store.onFetchMessages(data.chat_id).then(response => {
                if(response.status){             
                  results.payload.messages = [...response.payload];
                  results.status = true;
                  console.log('Emmiting messages', results);
                  socket.emit("populate", results)
                }
              }).catch(error => {
                // could not fetch chat messages
                  error_on_server_message(uid,socket,error);
              })      
            }
          }).catch(error => {
              // could not retrieve user information
              error_on_server_message(uid,socket,error);
          })
       }else{
           error_on_server_message(uid,socket,{message: 'unable to join chat-room'});
       }

     }).catch(error => {
      //  could not join chat room
         error_on_server_message(uid,socket,error);
     })
          
  });

  /***
     * obtain a list of users here
  ***/
  socket.on("users", data => {
    console.log('fetch a list of chat users',data);
    data_store.onFetchUsers(data.chat_id).then(response =>{
      if (response.status){
        socket.emit("users", response)
      }
    }).catch(error => {
        error_on_server_message(uid,socket,error);
    })

});



});
// // end of chat app
