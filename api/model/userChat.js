"use strict";

const mongoose = require("mongoose");

const usermsgSchema = mongoose.Schema({
  members:{
    type: Array,
  },
  message: {
    type: Array
  },
  msgType: {
    type: String,
    default: 'user'
  }
});

const usermsgMod = mongoose.model("usermsg", usermsgSchema);

module.exports = usermsgMod;
