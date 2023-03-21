"use strict";

const mongoose = require("mongoose");

const activitySchema = mongoose.Schema({
  user: {
    type: String
  },
  socketID: {
    type: String,
  },
  connected: {
    type: Boolean,
    default: false
  },
  roomid: {
    type: String
  }
},
{ timestamps: true });

const usersMod = mongoose.model("user", activitySchema);

module.exports = usersMod;
