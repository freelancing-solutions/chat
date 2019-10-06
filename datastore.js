const axios = require('axios')

const api_chat_endpoint = '/api/chat-rooms/';

const fetchChatRoom = async (uid,chat_id) => {
    
    const api_router = api_chat_endpoint + `${chat_id}/${uid}`;    
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

const storeChatRoom = async(uid,chat_room) => {
    const api_router = api_chat_endpoint + `${chat_id}/${uid}`;
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
};

module.exports = {
    store : storeChatRoom,
    fetch : fetchChatRoom
};