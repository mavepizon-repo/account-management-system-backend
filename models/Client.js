const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
{
  clientCode: {
    type: String,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);