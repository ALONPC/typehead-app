const mongoose = require("mongoose");

const nameSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  times: Number
});

module.exports = mongoose.model("Name", nameSchema);
