const axios = require('axios');
const config = require('config');
const mongodb = require('mongodb');


// use admin_uid to create new chat_room
const endpoint_server = process.env.STORE_ENDPOINT_SERVER || config.get('STORE_ENDPOINT_SERVER');
const admin_uid = process.env.ADMIN_USER || config.get("ADMIN_USER");

const connectDB = require('./database');
const ChatRoom = require('./database');
const ChatUsers = require('./database');
const Messages =  require('./database');

const chat_detail = {
    chat_room : {
        chat_id : "",
        created_by : "",
        name : "",
        description : ""
    },
    messages : [],
    users : [],
    _max_users : []
};

const attachment_detail = {
    download_url : "",
    filename : "",
    document_type : ""
};

const message_detail = {
    message_id : "",
    chat_id : "",
    uid : "",
    message : "",
    timestamp : 0,
    attachments : {
        filename : '',
        url : ''
    },
    archived : ""

};

const chat_user_detail = {
    chat_id : "",
    uid : "",
    gravatar : "",
    username : "",
    online : false,
    last_online : 0,
    chat_revoked : false,
    is_admin : true
};

const fetchChatRoom = async (uid,chat_id) => {
  
    let useuid = uid;
    if(admin_uid !== null)  useuid = admin_uid;
    
    // fetching a specific chatroom
    const api_router = endpoint_server + `/room/${chat_id}/${useuid}`;    
    const results = {status:true,payload:{},error:{}};

    await axios.get(api_router).then(response => {
        if (response.status === 200){
            return response.data;
        }else{
            throw new Error('there was an error fetching chat room data');
        }
    }).then(chat_room => {
        results.payload = {...chat_room};
        results.status = true;
        results.error = {};
    }).catch(error => {
        results.payload = {};
        results.status = false;
        results.error = {...error};
    });

    return results;
};


const storeChatRoom = async (uid, chat_room) => {
    let useuid = uid;
    if (admin_uid !== null) {
      useuid = admin_uid;
    }

    const api_router = endpoint_server + `/room/${useuid}`;
    const results = { status: true, payload: {}, error: {} };

    await axios.post(api_router, JSON.stringify(chat_room)).then(response => {
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error("there was an error saving chat room data");
        }
      }).then(chat_room => {
        results.status = true;
        results.payload = { ...chat_room };
        results.error = {};
      }).catch(error => {
        results.payload = {};
        results.status = false;
        results.error = { ...error };
      });

    return results;
};

const deleteChatRoom = async (uid,chat_id)  => {
      const api_router = endpoint_server + `/room/${chat_id}/${useuid}`;
      const results = { status: true, payload: {}, error: {} };

      await axios.delete(api_router).then(response => {
          if (response.status === true){
            return response.data;
          }else{
            throw new Error("there was an error deleting a chat room");
          }
      }).then(chat_room => {
        results.status = true;
        results.payload = {...chat_room};
        results.error = {};
      }).catch(error => {
        results.status = false;
        results.payload = {};
        results.error = {...error};
      });

      return results;
};

const updateChatRoom = async (uid,data) => {
      const api_router = endpoint_server + `/room/${chat_id}/${useuid}`;
      const results = { status: true, payload: {}, error: {} };

      await axios.update(api_router,JSON.stringify(data)).then(response => {
        if (response.status === true){
          return response.data;
        };
        throw new Error('there was an error updating chat room')
      }).then(chat_room => {
        results.status = true;
        results.payload = {...chat_room};
        results.error = {};
      }).catch(error => {
        results.status = false;
        results.payload = {};
        results.error = {...error};
      });

      return results;
};

/***
 * 
 * new utilities that works with google app engine as backend
 * 
 */


 /**
  * 
  * @param {*} message -- contains the message data sent by prepare message
  */
const onSendMessage = async message => {        
        const chat_id = message.chat_id;
        const api_router = endpoint_server + `/message/${chat_id}`;
        const results = { status: true, payload: {}, error: {} };
        console.log('sending message : ', message);
        await axios.post(api_router,JSON.stringify(message)).then(response => {
          if(response.status === 200){
            return response.data
          }
          throw new Error('error sending message')
        }).then(message => {
          results.status = true;
          results.payload = {...message};
          results.error = {};
        }).catch(error => {
          results.status = false;
          results.error ={...error};
          results.payload = {}
        });

        
        return results;
};

const onFetchMessages = async chat_id => {
        const api_router = endpoint_server + `/messages/${chat_id}`;
        const results = { status: true, payload: {}, error: {} };

        await axios.get(api_router).then(response => {
          if(response.status === 200){
            return response.data
          }
          throw new Error('error fetching messages')
        }).then(messages => {
          // console.log('returned messages',messages);
          results.status = true;
          results.payload = [...messages];
          results.error = {}
        }).catch(error => {
          results.status = false;
          results.payload = [];
          results.error = {...error};
        });

        return results;
};


// User functions


const onJoinChatRoom = async (user_detail,chat_id) => {
        const api_router = endpoint_server + `/user/${chat_id}`;
        const results = { status: true, payload: {}, error: {} };

        await axios.post(api_router,JSON.stringify(user_detail)).then(response => {
          if(response.status === 200){
            return response.data;
          }
          throw new Error(`there was an error joining chat-room${chat_id}`);
        }).then(chat_user => {
          results.status = true;
          results.payload = {...chat_user};
          results.error = {}
        }).catch(error => {
          results.status = false,
          results.payload = {},
          results.error = {...error}
        });
        return results;
};


const onFetchUsers = async chat_id => {
        const api_router = endpoint_server + `/users/${chat_id}`;
        const results = { status: true, payload: {}, error: {} };

        await axios.get(api_router).then(response => {
          if(response.status === 200){
            return response.data
          }
          throw new Error('there was an error fetching chat users');
        }).then(chat_users => {
          results.status = true;
          results.payload = [...chat_users];
          results.error = {};
        }).catch(error => {
          results.status = false;
          results.payload = [];
          results.error = {...error};
        });

        return results;
};

const onFetchUser = async uid => {
  const api_router = endpoint_server + `/user/${uid}`;
  const results = { status: true, payload: {}, error: {} };
  
  await axios.get(api_router).then(response => {
    if(response.status === 2000){
      return response.data;
    }
  }).then(user => {
    results.status = true;
    results.payload = {...user};
    results.error = {};
  }).catch(error => {
    results.status = false;
    results.payload = [];
    results.error = {...error};
  });

  return results;
}


// room utils

// creating a chat room for an app or for specific users
const onCreateRoom = async room_detail => {
        const api_router = endpoint_server + `/room`;
        const results = { status: true, payload: {}, error: {} };

        await axios.post(api_router,JSON.stringify(room_detail)).then(response => {
          if(response.status === 200){
            return response.data;
          }
          throw new Error('there was an error creating chat room')
        }).then(chat_room => {
          results.status = true;
          results.payload = {...chat_room};
          results.error = {};
        }).catch(error => {
          results.status = false;
          results.payload = {};
          results.error = {error};
        });
        return results;
};

// fetch a specific chat room by chat id
const onFetchRoom = async chat_id => {
        const api_router = endpoint_server + `/room/${chat_id}`;
        const results = { status: true, payload: {}, error: {} };

        await axios.get(api_router).then(response => {
            if(response.status === 200){
              return response.data
            }
            throw new Error('there was an error fetching room detail')
        }).then(chat_room => {
          results.status = true;
          results.payload = {...chat_room};
          results.error = {}
        }).catch(error =>{
          results.status = false;
          results.payload = {};
          results.error = {...error};
        });

        return results;
};


module.exports = {
  store: storeChatRoom,
  fetch: fetchChatRoom,
  delete: deleteChatRoom,
  update: updateChatRoom,

  onSendMessage: onSendMessage,
  onFetchMessages: onFetchMessages,
  onJoinChatRoom: onJoinChatRoom,
  onFetchUsers: onFetchUsers,
  onFetchUser : onFetchUser,
  onCreateRoom: onCreateRoom,
  onFetchRoom: onFetchRoom
};