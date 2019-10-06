let redis = require("redis");
let client = "";

const config = {redis: process.env.REDIS_URL};

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