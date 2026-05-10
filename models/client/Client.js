const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
{
  clientCode: {
    type: String,
    unique: true,
    index: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },

  address: {
    type: String,
    required: true,
    trim: true
  },

  contactPerson: {
    type: String,
    required: true,
    trim: true
  },

  emailid: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  gstnumber: {
    type: String,
    uppercase: true,
    trim: true
  },

},
{ timestamps: true }
);


module.exports = mongoose.model("Client", clientSchema);