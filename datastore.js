const axios = require('axios');


// use admin_uid to create new chat_room
const endpoint_server = process.env.STORE_ENDPOINT_SERVER || 'http://localhost:46080/api/chat-rooms/'
const admin_uid = process.env.ADMIN_USER || null;

const fetchChatRoom = async (uid,chat_id) => {
    let useuid = uid;
    if(admin_uid !== null) { useuid = admin_uid;};

    const api_router = endpoint_server + `${chat_id}/${useuid}`;    
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

        const api_router = endpoint_server + `${chat_id}/${useuid}`;
        const results = { status: true, payload: {}, error: {} };

        await axios
          .post(api_router, chat_room)
          .then(response => {
            if (response.status === 200) {
              return response.data;
            } else {
              throw new Error("there was an error saving chat room data");
            }
          })
          .then(chat_room => {
            results.status = true;
            results.payload = { ...chat_room };
            results.error = {};
          })
          .catch(error => {
            results.payload = {};
            results.status = false;
            results.error = { ...error };
          });

        return results;
      };;

module.exports = {
    store : storeChatRoom,
    fetch : fetchChatRoom
};