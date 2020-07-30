
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
    uid:'',
    message:'',
    timestamp:'',
    attachments : ''
};


// structure for every chat user
const chat_user = {
    chat_id : '',
    uid : ''
};


// find a way to permanently store chat rooms data 
// example in firebase or cloud store if chat rooms is empty then retrieve chat room information from there

const chat_rooms = [];


const createChatRoom = data => {
  const room = {...chat_room};
  try{
    room.chat_id = data.chat_id;
    room.created_by = data.uid;
    room.users.push({chat_id : data.chat_id,uid: data.uid});
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
        chat_room.created_by = data.uid;
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

      const uid = data.uid;
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

// data must pass uid and chat_id
// with chat_id obtain a list of users id's from mongodb or alternatively from appengine store
// if app engine data must pass the server_url
// consider using redis to cache the results of users list and also messages


const onLogin = (data) => {

};

const onLogout = (data) => {

};




/**
 * 
 * new functions that works with google app engine as backend
 * 
 * 
 */



 /**
  * 
  * @param {    chat_id : {type:String, required : true},
    message_id : {type:String, required:true},
    uid : {type:String, required:true},
    message : {type:String, required:true},
    timestamp : String,
    attachments : String} data 
  */
 const sendMessage = async data => {
    const message_detail = {
      chat_id : data.chat_id,
      message_id: uuidv4(),
      uid : data.uid,
      message: data.message,
      timestamp : Date.now(),
      attachments : data.attachments,
      archived : data.archived,
    };
    return await  data_store.onSendMessage(message_detail);        
 };

 
 const fetchMessages = async data => {
    const {chat_id} = data;
    return await data_store.onFetchMessages(chat_id);
 };

    // chat_id = ndb.StringProperty()
    // uid = ndb.StringProperty()
    // gravatar = ndb.StringProperty()
    // username = ndb.StringProperty()
    // online = ndb.BooleanProperty(default=False)
    // last_online = ndb.IntegerProperty() # in millisecond
    // chat_revoked = ndb.BooleanProperty(default=False)
    // is_admin = ndb.BooleanProperty(default=False)

// users utils
// this is more like add user

// Do this on the front end
 const createGravatar = async email => {

 };

 const joinChatRoom = async data => {
    const user_detail = {
      chat_id : data.chat_id,
      uid : data.uid,
      gravatar : data.gravatar,
      username : data.username,
      online : true,
      last_online : Date.now(),
      chat_revoked : false,
      is_admin : data.is_admin
    }

    return await data_store.onJoinChatRoom(user_detail);
 };

 const fetchUsers = async data => {
   const {chat_id} = data;

   return await data_store.onFetchUsers(chat_id);
 };

// chat room utils
 const createRoom = async data => {
   const room_detail = {
     chat_id : data.chat_id,
     create_by : data.create_by,
     name : data.name,
     description : data.description
   }

   return await data_store.onCreateRoom(room_detail);
 };

 const fetchRoom = async data => {
   const {chat_id} = data;
   return await data_store.onFetchRoom(chat_id);
 }

module.exports = {
  prepareMessage: prepareMessage,
  onClearMessages: onClearMessages,
  userJoinedChat: userJoinedChat,
  onPopulate: onPopulate,
  connections: connections,
  login: onLogin,
  logout: onLogout,

  sendMessage: sendMessage,
  fetchMessages: fetchMessages,
  joinChatRoom: joinChatRoom,
  fetchUsers: fetchUsers,
  createRoom: createRoom,
  fetchRoom : fetchRoom
};

