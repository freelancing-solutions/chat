let mongoose = require("mongoose");



const connectDB = async () => {
        mongoose.connect(process.env.MONGODB_URI || config.get("mongoDB"), {
          useNewUrlParser: true
        });

        const db = mongoose.connection;

        db.on("connected", () => {
          console.log("mongo db successfully connected");
          return true;
        });
        db.on("disconnected", () => {
          console.log("mongo db successfully disconnected");
          return false;
        });
        db.on("error", () => {
          console.log("Error connecting to mongo db");
          return false;
        });

        // Use mongoose to save data to local database there by allowing an API
        // that retrieves data from previous days
};

exports.ChatRoom = mongoose.model("ChatRoom", require("./chatRoomSchema"));
exports.ChatUsers = mongoose.model("ChatUsers", require("./chatUsersSchema"));
exports.Messages = mongoose.model('Messages', require("./messagesSchema"));
module.exports = connectDB;

