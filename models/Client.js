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
  },

  contactPerson: {
    type: String,
    required: true
  },

  emailid: {
    type: String,
    required:true,
    lowercase:true
  },

  gstnumber: {
    type: String,
    required:true,
    uppercase:true
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);