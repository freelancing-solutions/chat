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
            attachments : {
                filename : '',
                url : ''
            },
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
            attachments : {
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


/****
 *
 * Populate message
 */

const populate_to_all = async (socket,chat_id,uid) => {
        let results = {status: true, payload : {users: [], messages : []}, error:{}};

        await data_store.onFetchMessages(chat_id).then(response => {
            if(response.status){
              results.payload.messages = [...response.payload];
            }
        }).catch(error => {
            // could not fetch chat messages
              error_on_server_message(uid,socket,error);
        });

        await data_store.onFetchUsers(chat_id).then(users_response => {
          console.log('is this users', users_response);
        if (users_response.status){
            results.payload.users = [...users_response.payload];
        }
        }).catch(error => {
            // could not fetch chat messages
              error_on_server_message(uid,socket,error);
        });

        results.status = true;

        await socket.broadcast.emit("populate", results);

        await socket.emit("populate", results);

        return results
};


/***
 *
 * command_messages
 */
    const command_messages = [
        {
            message : '#pocket-link-home',
            response : `Pocket Money ... <a href="../"><i class="fa fa-home"> </i> Home </a>`
        },

        {
            message : '#pocket-link-about',
            response : `Pocket Money About ... <a href="../about"><i class="fa fa-info"> </i> About </a>`
        },

        {
            message : '#pocket-link-contact',
            response : `Pocket Money Affiliate How to ... <a href="../contact"><i class="fa fa-envelope"> </i> Contact </a>`
        },
        {
            message : '#pocket-link-affiliate',
            response : `Pocket Money Affiliate How to ... <a href="../affiliate-instructions"><i class="fa fa-line-chart"> </i> Affiliate How To ? </a>`
        },
        {
            message :'#pocket-link-affiliate-profiles',
            response : `Pocket Money Affiliate Profiles ... <a href="../affiliates"><i class="fa fa-users"> </i> Affiliate Profiles </a>`
        },
        {
            message : '#pocket-link-investment-plans',
            response : `Pocket Money Sample Investment Plans ... <a href="../plans/p2p-investment-plans"><i class="fa fa-bar-chart"> </i> Sample Investment Plans </a>`
        },
        {
            message :'#pocket-link-account',
            response : `Pocket Money Account ... <a href="../admin-account"><i class="fa fa-sign-in"> </i> Account </a>`
        },
        {
            message :'#pocket-link-wallet',
            response : `Pocket Money Wallet ... <a href="../admin-wallet"><i class="fa fa-google-wallet"> </i> Wallet </a>`
        },
        {
            message :'#pocket-link-deposit',
            response : `Pocket Money Deposits ... <a href="../admin-wallet-deposit"><i class="fa fa-credit-card"> </i> Deposits </a>`
        },
        {
            message :'#pocket-link-withdrawal',
            response : `Pocket Money Withdrawals ... <a href="../admin-wallet-withdraw"><i class="fa fa-credit-card"> </i> Withdrawals </a>`
        },
        {
            message :'#pocket-link-auto-investments',
            response : 'Pocket Money Auto Investments ... <a href="../auto-investments"><i class="fa fa-bar-chart"> </i> Auto Investments </a>'
        },
        {
            message :'#pocket-link-p2p-groups',
            response : 'Pocket Money P2P Groups ... <a href="../p2p-groups"><i class="fa fa-users"> </i> P2P Groups </a>'
        },
        {
            message :'#pocket-link-my-group-members',
            response : 'Pocket Money P2P Group Members ... <a href="../p2p-members"><i class="fa fa-users"> </i> My P2P Group Members </a>'
        },
        {
            message :'#pocket-link-funding-howto',
            response : 'Pocket Money Funding How to ... <a href="../p2p-instructions"><i class="fa fa-money"> </i> Funding How to ? </a>'
        },
        {
            message :'#pocket-link-edit-affiliate',
            response : 'Pocket Money Edit Affiliate Profile ... <a href="../affiliate-program/"><i class="fa fa-line-chart"> </i> My Affiliate Profile </a>'
        },
        {
            message :'#pocket-link-my-affiliate-profile',
            response : 'Pocket Money My Affiliate Profile ... <a href="../affiliate-program/"><i class="fa fa-line-chart"> </i> My Affiliate Profile </a>'
        },
        {
            message :'#pocket-link-blog',
            response : 'Pocket Money Blog ... <a href="../blog"><i class="fa fa-book"> </i> Blog </a>'
        },
        {
            message :'#pocket-link-create-post',
            response : 'Pocket Money Blog Guest Post ... <a href="../blog/guest-blogging"><i class="fa fa-book"> </i> Create Post </a>'
        },
        {
            message :'#pocket-link-news',
            response : `Pocket Money News ... <a href="../news"><i class="fa fa-book"> </i> News </a>`
        },
        {
            message :'#pocket-link-logout',
            response :`Pocket Money Logout ... <a href="../logout"><i class="fa fa-sign-out"> </i> Log Out </a>`
        },
        {
            message :'#pocket-link-login',
            response : `Pocket Money Login ... <a href="../login"><i class="fa fa-sign-in"> </i> Sign In </a>`
        },
        {
            message :'#pocket-link-signup',
            response : `Pocket Money Sign Up ... <a href="../signup"><i class="fa fa-link"> </i> Sign Up </a>`
        }

    ];


/***
 *
 * process commands and send response to user
 */

const process_command = (message) => {
    for (const com_message of command_messages){
        if (com_message.message === message.message.toLowerCase()){
            return `${com_message.response} -- ${com_message.message}`
        }
    }
    return message.message;
};


/**
 *
 * do message contain command
 *
 */

const is_command = message => {

    for (const com_message of command_messages){
        if (com_message.message === message.message.toLowerCase()){
            return true;
        }
    }
    return false;
};


/***
 * check if user has token
 * TODO- in the future authroize the user token
 */
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


    // check if message is command if yes then process command and send response
        /*** its a command message*/
        data.payload.message.message = process_command(data.payload.message);
        /** its normal chat message */
        data_store.onSendMessage(data.payload.message).then(response => {
          if (response.status){
              populate_to_all(socket,data.payload.message.chat_id,data.payload.message.uid).then(response => console.log('done sending populate'))
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
