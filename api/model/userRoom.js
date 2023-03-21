"use strict";

const mongoose = require("mongoose");

const userRoomSchema = mongoose.Schema({
  users: {
    type: Array
  },
  type: {
    type: String,
    default: "user"
  },
  roomid: {
    type: String
  }
},
{ timestamps: true });

const userRoomMod = mongoose.model("userRoom", userRoomSchema);

module.exports = userRoomMod;
