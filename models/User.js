const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "default.png" },
  short_description: String,
});

const User = mongoose.model("User", usersSchema);
module.exports = User;