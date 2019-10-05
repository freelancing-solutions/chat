'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const uuidv4 = require('uuid/v4');

const axios = require('axios');

const PORT = process.env.PORT || 5000;
const INDEX = path.join(__dirname, 'index.html');
let redis = require('redis');
let credentials = '';
let client = '';
let host = "redis-17273.c85.us-east-1-2.ec2.cloud.redislabs.com:17273";

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

credentials = {
  user: "mobiusndou@gmail.com",
  password: "Mobius5627084@",
  host: "redis-17273.c85.us-east-1-2.ec2.cloud.redislabs.com:17273",
  port: 6379
};

client = redis.createClient(
  "redis://" +
    credentials.user +
    ":" +
    credentials.password +
    "@" +
    credentials.host +
    ":" +
    credentials.port
);

console.log("Client Redis", client);


let connections = [];


const chat_room = {
  chat_id: "",
  created_by: "",
  messages: [],
  users : []  
};


const chat_rooms = [];


const retrieveFromRedis = async data => {

  let redisKey = `chat_id:${data.chat_id}`;
  let chat_room;

  client.get(redisKey,(error,results) => {
    if(results){
      chat_room = results

    }else{      
  
      chat_room = {}      

    }
  });

  return chat_room
};

const storeToRedis = async data => {
  let redisKey = `chat_id:${data.chat_id}`;
  
  client.setex(redisKey,3600,JSON.stringify(data))
  return true;
};


const prepareMessage = async data => {
    
    data.timestamp = Date.now();
    data.message_id = uuidv4();
    console.log(data);

    let messages = [];
    let chat_rooms = chat_rooms.find(chat => chat.chat_id === data.chat_id);    
    if (chat_index > -1){      
        chat_rooms[chat_index].messages.push(data);
        messages = chat_rooms[chat_index].messages;
    }else{
      chat_room.chat_id = data.chat_id;
      chat_room.created_by = data.author;
      chat_room.messages.push(data);
      chat_rooms.push(chat_room);
      messages = chat_room.messages;
    };
  
    console.log("Previous messages", messages);  
    return messages;
};

const onClearMessages = async data => {
    // check to see if the user is an admin
    // then clear messages
    let chat_index = chat_rooms.findIndex(
      chat => chat.chat_id === data.chat_id
    );
    if (chat_index > -1){
      chat_rooms[chat_index].messages = [];
    }
    
    return [];
};

const userJoinedChat = async data => {

  let chat_index = chat_rooms.findIndex(chat => chat.chat_id === data.chat_id);
 
  if (chat_index > -1){
    chat_rooms[chat_index].users.push(data);
  }else{
    chat_room.chat_id = data.chat_id;
    chat_room.created_by = data.author;
    chat_room.users.push(data);
    chat_rooms.push(chat_room);
  }

  return chat_rooms[chat_index].users;
};

const onPopulate = async data => {
  let chat_index = chat_rooms.findIndex(chat => chat.chat_id === data.chat_id);

  let messages = [];
  if (chat_index > -1){
    messages = chat_rooms[chat_index].messages;
  }

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
    });

  });

  socket.on("typing", data => {
    socket.broadcast.emit("typing", data);
  });
    
  socket.on("join", data => {
    console.log('join message',data);
    userJoinedChat(data).then(results => {
      io.sockets.emit("join", results);
    });
    
  });
  
  socket.on("clear", data => {
    console.log('clear message', data);
    onClearMessages(data).then(results => {
      io.sockets.emit("chat", results);
    });    
  });

  socket.on("populate", data => {
    console.log('populate message',data);
     onPopulate(data).then(results => socket.emit("populate", results));      
  });

});



// end of chat app
