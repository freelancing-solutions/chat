'use strict';
// app main requires
const feathers = require("@feathersjs/feathers");
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

// chat requires
const chat_utils = require('./chat-utils');
const data_store = require('./datastore');
const pocket_bot = require('./pocket-money.bot');

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
            attachments : {
                message_id : '',
                filename : '',
                url : ''
            },
            archived : false
        };
    const results = {status : true, payload : {message:{...message}}, error: {}};
    socket.broadcast.emit("chat", results);
};

/**
 * user left chat messages
 * @param uid
 * @param socket
 */
const user_left_chat = (uid,socket) => {
    const message = {
            message_id : `${uid}485345`,
            chat_id : "p-m",
            uid : `${uid}`,
            message : "i left chat goodbye",
            timestamp : Date.now(),
            attachments : {
                message_id : '',
                filename : '',
                url : ''
            },
            archived : false
        };
    const results = {status : true, payload : {message:{...message}}, error: {}};
    socket.broadcast.emit("chat", results);
};
/*****
 *
 *
 * @param uid
 * @param socket
 * @param error
 */
const error_on_server_message = (uid,socket, error) => {
    const message = {
            message_id : `${uid}485345`,
            chat_id : "p-m",
            uid : `${uid}`,
            message : `server error : ${error.message} please inform admin about this`,
            timestamp : Date.now(),
            attachments : {
                filename : '',
                url : ''
            },
            archived : false
        };
    const results = {status : true, payload : {message:{...message}}, error: {}};
    socket.emit("chat", results);

};


/**
 * Populate message
 **/

const populate_to_all = async (app,socket,chat_id,uid) => {
        let results = {status: true, payload : {users: [], messages : []}, error:{}};

        await data_store.onFetchMessages(chat_id).then(response => {
            if(response.status){

              results.payload.messages = [...response.payload];
            data_store.onFetchUsers(chat_id).then(users_response => {
            if (users_response.status){

                results.payload.users = [...users_response.payload];
                results.status = true;

                app.io.sockets.emit('populate', results);
            }
            }).catch(error => {
                // could not fetch chat messages
                  error_on_server_message(uid,socket,error);
            });

            }
        }).catch(error => {
            // could not fetch chat messages
              error_on_server_message(uid,socket,error);
        });

        // await socket.broadcast.emit("populate", results);
        // await socket.emit("populate", results);
        return results
};

/**** fast check for command **/

const check_for_command = message => {
    if (message.startsWith('#')){
        return true;
    }
    return false;
}



/***
 * starting server
 */
app.listen(PORT).on('listening', () => console.log(`Realtime server running on ${PORT}`));



/***
 * check if user has token
 * TODO- in the future authroize the user token
 */
// app.io.use((socket, next) => {
//     let uid = socket.handshake.query.token;
//     if (uid === ''){
//         return next(new Error('cannot accept null token'));
//     }
//     if (data_store.chat_detail.add_connection(uid,socket)){
//
//         return next();
//     }
//     return next(new Error('already connected'))
// });


/***
 * sending processing message and storing to data store
 ***/
const process_and_store_messages = async (socket,uid,app, processed_message) => {
    const results = {status : true, payload : [], error : {}}
    /** memoization message on local datastructures **/
    let stored_messages = data_store.chat_detail.add_message(processed_message.message);
    results.status = true;
    results.payload = [...stored_messages];
    /** broadcasting message to all chat sessions **/
    app.io.sockets.emit('chat', results);


    // try{
    //     /** checking if there where any toxic message of which if it was the case then send a warning to the user **/
    //     let is_toxic = await data_store.chat_detail.detect_toxicity(processed_message.message.message)
    //     if (is_toxic){socket.emit('warning we are detecting toxic text being sent by you please refrain from this or your account will be suspended')}
    // }catch (error){
    //     console.log('toxic error', error.message);
    // }

    /*** sending messages to google app engine datastore **/
    data_store.onSendMessage(stored_messages[stored_messages.length -1]).then(response => {
        if (!response.status){
            socket.emit('warning system failure pending... admins where notified ');
        }
    }).catch(error => {
        error_on_server_message(uid, socket, error);
    });

    return results;
};

app.io.set('transports', ['websocket']);

app.io.on("connection", socket => {
    
    let uid = socket.handshake.query.token;

  // disconnect---here a user leaves a chat room---consider turning the user offline
  socket.on("disconnect", data => {
    data_store.chat_detail.remove_connection(uid);
        // send message to other open connections informing them that the other user left
        // remove the user users list, and rebroadcast the users list
  });

  // create chat room --- here a user creates a chat room---

  socket.on("create-room", data => {
      const chat_room = data_store.chat_detail.setup_chat_room(data);
      app.io.sockets.emit('get-room', chat_room);
  });

  // fetches room data
  socket.on("get-room",data => {
       const chat_room = data_store.chat_detail.get_room()
      socket.emit("get-room", chat_room);
  });


  /**
   *  on chat is where users actually sends chat messages
   * */
  socket.on("chat", data => {
    const results = {status : true, payload : {}, error : {}}
    results.payload = {...data.payload};

        let processed_message = data.payload;
        /*** check if message is command if yes then process command and send response **/
        /*** its a command message **/
        let process_response = '';
        if (check_for_command(processed_message.message.message)){

            pocket_bot.process_command(processed_message.message).then(message => {
                processed_message.message.message = message;
                process_response = process_and_store_messages(socket,uid,app,processed_message);
            }).catch(error => {
                socket.emit('error processing command, if you need this resolved open a ticket with this message : ', error.message);
            })

        }else{
            process_response = process_and_store_messages(socket,uid,app,processed_message);
        }
  });

  /***
     * on typing is where users gets status updates
   ***/
  socket.on("typing", data => {
        /*** use socket to emit the typing message to everyone presently dont work though **/
        const results = {status : true, payload : {typing : {} , user : {}}, error: {}};

        data.payload.typing.timestamp = Date.now();
        data.payload.user.last_online = Date.now();
        results.payload = {...data.payload};        
        /** sending on typing event to everyone else except the user typing **/
        socket.broadcast.emit("typing", results);
  });

  /**
   * on join is where users joins a chat room
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
      if (data.is_admin){
      //  implement this functionality
      }else{
          error_on_server_message(uid,socket,{message: 'you are not authorized to clear chat-room, ask admin'})
      }
  });

  // on populate can fetch users list and messages list
  // todo make sure it fetches users list as well
  socket.on("populate", data => {
     const results = {status: true, payload : {users: [], messages : []}, error:{}};

     // consider adding user information on chat room
     data_store.onJoinChatRoom(data,data.chat_id).then(response => {

       if (response.status){
          data_store.onFetchUsers(data.chat_id).then(response => {

            if(response.status){         
              results.payload.users = [...response.payload];
      
              data_store.onFetchMessages(data.chat_id).then(response => {
                if(response.status){             
                  results.payload.messages = [...response.payload];
                  results.status = true;

                  //emitting to just that user who logged in
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

    data_store.onFetchUsers(data.chat_id).then(response =>{
      if (response.status){
        socket.emit("users", response)
      }
    }).catch(error => {
        error_on_server_message(uid,socket,error);
    });

  /*** when use leaves chat room broadcast to everyone else that the user has left the chatroom ***/
  socket.on("left-chat", data => {
        user_left_chat(uid,socket);
  });


  /*** when user joins chat communicates to everyone else that user has joined the chatroom **/

  socket.on("user-joined", data => {
      user_joined_chat(uid,socket);
  });

});



});
// // end of chat app
