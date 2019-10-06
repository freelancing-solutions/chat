let redis = require("redis");
let client = "";

const config = {
  redis:
    "redis://h:p8848c3885c9df93845e59c3aaec54f4c26aa961f991452e6ac5484416c68f5c4@ec2-54-156-246-25.compute-1.amazonaws.com:15469"
};

client = redis.createClient(config.redis);



const retrieveFromRedis = async () => {

  let redisKey = `chat_id:${data.chat_id}`;

  let chat_room;

  client.get(redisKey, (error, results) => {
    if (results) {
      chat_room = {...results};
    } else {
      chat_room = null;
    }
  });

  return chat_room;
};

const storeToRedis = async data => {
  let redisKey = `chat_id:${data.chat_id}`;

  client.setex(redisKey, 3600, JSON.stringify(data));
  return true;
};


module.exports ={
  store : storeToRedis,
  retrieve : retrieveFromRedis
};