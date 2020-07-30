let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let chatRoomSchema = new Schema({
  created_by: String,
  chat_id: {type:String, required:true},
  name : String,
  description : String,
  
});



module.exports = chatRoomSchema;
