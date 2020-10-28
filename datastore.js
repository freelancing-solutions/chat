const axios = require('axios');
const config = require('config');
const {v4: uuidv4} = require("uuid");

// use admin_uid to create new chat_room
const endpoint_server = process.env.STORE_ENDPOINT_SERVER || config.get('STORE_ENDPOINT_SERVER');
const pocket_endpoint_server = process.env.POCKET_MONEY_ENDPOINT || config.get('POCKET_MONEY_ENDPOINT');
const admin_uid = process.env.ADMIN_USER || config.get("ADMIN_USER");


Array.prototype.contains_message = function(message) {
  for (var i = 0; i < this.length; i++) {
    if (this[i].message_id === message.message_id) return true;
  }
  return false;
};

Array.prototype.unique_message = function() {
  var arr = [];
  for (var i = 0; i < this.length; i++) {
    if (!arr.contains_message(this[i])) {
      arr.push(this[i]);
    }
  }
  return arr;
}

function Chat_instance(){
    this.bootstrapped = false;
    this.chat_room = {
        chat_id : "p-m",
        created_by : "",
        name : "",
        description : ""
    };
    this.messages = [];
    this.users = [];
    this.connections = [];
    this._max_users = 1000;
    this._max_messages = 10000;
    this.read_promises = [];
    this.write_promises = [];


    this.setup_chat_room = (chat_room) => {
        this.chat_room.chat_id = chat_room.chat_id;
        this.chat_room.created_by = chat_room.created_by;
        this.chat_room.name = chat_room.name;
        this.chat_room.description = chat_room.description;
        /*** store chatroom data to storage ***/

        return this.chat_room;
    };

    this.get_room = () => {
        if (this.chat_room.chat_id){
            return this.chat_room;
        }else{
            /*** fetch chatroom data from storage ***/
        }

    };
    this._add_store_message  = (message) => {
        if(Array.isArray(this.messages) && (this.messages.length < this._max_messages)){

            this.messages = this.messages.concat(message);
            this.messages = this.messages.unique_message();
        }
    };


    this.add_message = (message) => {
        /** if messages buffer is full half empty the buffer **/
        if((Array.isArray(this.messages)) && (this.messages.length > this._max_messages)){
            for (let i = 0; i < Math.floor(this._max_messages/2); i++){
                let throw_away = this.messages.shift();
            }
        } /** TODO- i might use this function when buffer is full **/

        const local_message = {...message};
        local_message.message_id = uuidv4();
        local_message.timestamp = Date.now(); /*** time already in millisends ***/

        if (local_message.attachments.url !== "") {
            local_message.attachments.message_id = message.message_id;
        }

        this.messages.push(local_message);
        return this.messages;
    };

    this.read_messages = () => {
      if (Array.isArray(this.messages) && (this.messages.length > 0)){
          if (this.messages.length < Math.floor(this._max_messages / 2)){
              return this.messages
          }else{
              let start = this.messages.length - Math.floor(this._max_messages / 2);
              let end = this.messages.length - 1;
              return this.messages.slice(start, end)
          }
      }else{
          this.read_promises.push(on_fetch_messages(this.chat_room.chat_id));
      }
    };


    this._merge_users = (existing, user) => {
           if ((existing.username === '') && (user.username !== '')){
                existing = {...user};
            }
           return existing
    };

    this.add_user = (user) => {
       let existing_user = {...chat_user_detail}
       if (Array.isArray(this.users) ){
         let found_user = this.users.find(user => user.uid === user.uid)
           if (found_user){existing_user = found_user}
       }
       existing_user = this._merge_users(existing_user,user);
        /**if there was an existing user this will replace the user with a new user ***/
        let temp_users = this.users.filter( user => user.uid === existing_user.uid);
        temp_users.push(existing_user);
        this.users = temp_users
    };

    this.read_users = () => {
        if(Array.isArray(this.users)){
            return this.users
        }
        return [];
    };

    this.add_connection = (uid,socket) => {
        let connection = {
            uid : '',
            socket : ''
        }
      if(Array.isArray(this.connections) && (this.connections.find(connection => connection.uid === uid))){
          return true;
       }
       connection.uid = uid;
       connection.socket = socket;
       this.connections.push(connection);
       return true;
    };


    this.remove_connection = (uid) => {
        if (Array.isArray(this.connections)){
            this.connections = this.connections.filter(connection => connection.uid === uid)
        }

    };

    this.get_connection = (uid) => {
        if (Array.isArray(this.connections) && (this.connections.length > 0)){
            let this_connection = this.connections.find(connection => connection.uid === uid);
            if (this_connection){return this_connection}
        }
        return ""
    };

    /*** auth token asks pocket money api not the chat_server api to verify the token **/
    this.auth_token =async uid => {
        const results = {status: false, payload : {authorized: false}, error: {}};
        let auth_url = pocket_endpoint_server + `/auth/${uid}`;
        /*** checking if user already connected if yes then user is already authorized **/
        if (this.connections.find(user => user.uid === uid)){
            results.status = true;
            results.authorized = true;

        }else {
            await axios.get(auth_url).then(response => {
                if (response.status) {
                    return response.data;
                }
            }).then(response => {
                results.status = response.status;
                results.payload = response.payload;
                results.error = {message: response.error};
            }).catch(error => {
                results.status = false;
                results.error = {...error};
            });
        }
        return results.payload.authorized && results.status;
    }

    /**** end object ***/
};


let chat_detail = new Chat_instance();

const attachment_detail = {
        message_id : '',
        filename : '',
        url : ''
};

const message_detail = {
    message_id : "",
    chat_id : "",
    uid : "",
    message : "",
    timestamp : 0,
    attachments : {
        message_id : '',
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
const on_send_message = async message => {
        const chat_id = message.chat_id;
        const api_router = endpoint_server + `/message/${chat_id}`;
        const results = { status: true, payload: {}, error: {} };
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
          results.payload = {...message}
        });

        return results;
};

const on_fetch_messages = async chat_id => {
        const api_router = endpoint_server + `/messages/${chat_id}`;
        const results = { status: true, payload: [], error: {} };

        if ( Array.isArray(chat_detail.messages) && (chat_detail.messages.length < chat_detail._max_messages)){
            await axios.get(api_router).then(response => {
                if (response.status === 200) {
                    return response.data
                }
                throw new Error('error fetching messages')
            }).then(messages => {

                results.status = true;
                results.payload = [...messages];
                results.error = {}
            }).catch(error => {
                results.status = false;
                results.payload = [];
                results.error = {...error};
            });
            results.payload.forEach(message => chat_detail._add_store_message(message));
            results.payload = [...chat_detail.messages];
        }else{
            results.payload = [...chat_detail.messages];
        }
        return results;
};



const on_join_chat_room = async (user_detail,chat_id) => {
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


const on_fetch_users = async chat_id => {
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
        results.payload.forEach(user => chat_detail.add_user(user));
        return results;
};

const on_fetch_user = async uid => {
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
const on_create_room = async room_detail => {
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
const on_fetch_room = async chat_id => {
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




/**** bootstrapping functions ***/
const bootstrap_messages = () => {
    if (!chat_detail.bootstrapped){
        on_fetch_messages(chat_detail.chat_room.chat_id).then(response => {
            chat_detail.bootstrapped = true;
        })
    }
};

const bootstrap_users = () => {
    on_fetch_users(chat_detail.chat_room.chat_id).then(response => {
    })
};

const bootstrap = () => {
    bootstrap_messages();
    bootstrap_users();
};

bootstrap();


module.exports = {
  store: storeChatRoom,
  fetch: fetchChatRoom,
  delete: deleteChatRoom,
  update: updateChatRoom,

  onSendMessage: on_send_message,
  onFetchMessages: on_fetch_messages,
  onJoinChatRoom: on_join_chat_room,
  onFetchUsers: on_fetch_users,
  onFetchUser : on_fetch_user,
  onCreateRoom: on_create_room,
  onFetchRoom: on_fetch_room,
  chat_detail: chat_detail
};