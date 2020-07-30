let mongoose = require("mongoose");
let Schema = mongoose.Schema;



let messagesSchema = new Schema({
    chat_id : {type:String, required : true},
    message_id : {type:String, required:true},
    author : {type:String, required:true},
    message : {type:String, required:true},
    timestamp : String,
    attachments : String
});


module.exports = messagesSchema;