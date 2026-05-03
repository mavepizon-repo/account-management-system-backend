const mongoose = require("mongoose");

const labourSchema = new mongoose.Schema(
{
  labourId: {
    type: String,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true,
    unique: true
  },

  address: {
    type: String,
    required: true
  },

  workType: {
    type: String,
    required: true
  },

  dailyWage: {
    type: Number,
    required: true
  },

  description: {
    type: String,
    default: ""
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Labour", labourSchema);