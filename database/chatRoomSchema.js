let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let chatRoomSchema = new Schema({
  chat_id: String,
  created_by: String,
  users_list: [{ userid: String, username: String }],
});

module.exports = chatRoomSchema;
