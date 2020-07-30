let mongoose = require("mongoose");
let Schema = mongoose.Schema;


let chatUsersSchema = new Schema({
  chat_id: {type:String, required:true},
  uid: {type:String, required:true},
  username: {type : String, required:true},
});


module.exports = chatUsersSchema;