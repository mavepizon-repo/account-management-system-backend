const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
{
  vendorCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  phone: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  address: {
    type: String,
    trim: true
  },

  gstNo: {
    type: String,
    trim: true,
    uppercase: true
  },

  website: {
    type: String,
    trim: true
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);