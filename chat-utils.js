
const uuidv4 = require("uuid/v4");
const axios = require("axios");

const data_store = require('./datastore');

const connections = [];

// chat room will contain the present chat room information
const chat_room = {
  chat_id: "",
  created_by: "",
  messages: [],
  users: []
};


// structure for every chat message
const chat_message = {
    chat_id : '',
    message_id : '',
    author:'',
    message:'',
    timestamp:'',
    attachments : ''
};


// structure for every chat user
const chat_user = {
    chat_id : '',
    author : ''
};


// find a way to permanently store chat rooms data 
// example in firebase or cloud store if chat rooms is empty then retrieve chat room information from there

const chat_rooms = [];


const createChatRoom = data => {
  const room = {...chat_room};
  try{

    room.chat_id = data.chat_id;
    room.created_by = data.author;
    room.users.push({chat_id : data.chat_id,author: data.author});
    room.messages.push(data);
    return room;

  }catch(error){
    return null;
  };
};

const prepareMessage = async data => {
  try{

    data.timestamp = Date.now();
    data.message_id = uuidv4();
    let messages = [];
    let chat_index = chat_rooms.findIndex(chat => chat.chat_id === data.chat_id);
  
    chat_rooms[chat_index].messages.push(data);
    messages = chat_rooms[chat_index].messages;
    return messages;
  }catch(error) {
    return null
  };
  
};


const onClearMessages = async data => {
  // check to see if the user is an admin
  // then clear messages
  try{
       let chat_index = chat_rooms.findIndex(
         chat => chat.chat_id === data.chat_id
       );
       if (chat_index > -1) {
         chat_rooms[chat_index].messages = [];
       }
     }catch(error){
        return null     
     }

  return [];
};

const userJoinedChat = async data => {
  try{
      let chat_index = chat_rooms.findIndex(chat => chat.chat_id === data.chat_id);
    
      if (chat_index > -1) {
        chat_rooms[chat_index].users.push(data);
      } else {
        chat_room.chat_id = data.chat_id;
        chat_room.created_by = data.author;
        chat_room.users.push(data);
        chat_rooms.push(chat_room);
      }

      return chat_rooms[chat_index].users;

  }catch(error){
    return null
  }

};

const onPopulate = async data => {
  
    let chat_index = chat_rooms.findIndex(chat => chat.chat_id === data.chat_id);
    let messages = [];

    if (chat_index > -1) {
      messages = chat_rooms[chat_index].messages;
    }else{

      const uid = data.author;
      const chat_id = data.chat_id;

      data_store.fetch(uid,chat_id).then(response => {
        
            if (response.status){
              chat_rooms.push(response.payload);
              chat_index = chat_rooms.length - 1;
              messages = chat_rooms[chat_index].messages;
            }else{
              let response = createChatRoom(data);
              chat_rooms.push(response);
              const chat_room = response;
              
              data_store.store(uid,chat_room).then(response => {
                  console.log(response);
              }).catch(error => {
                //TODO use some sort of error reporting and send back to main endpoint
                console.log(error);
              });
            }

          }).catch(error => {
            //TODO use some sort of error reporting and send back to main endpoint
            console.log(error);
          });
    }

    return messages;
};


const onLogin = (data) => {

};

const onLogout = (data) => {

};


module.exports ={
  prepareMessage : prepareMessage,
  onClearMessages : onClearMessages,
  userJoinedChat : userJoinedChat,
  onPopulate : onPopulate,
  connections : connections,
  login : onLogin,
  logout : onLogout
};

