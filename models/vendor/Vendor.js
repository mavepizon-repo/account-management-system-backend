const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
{
  vendorCode: {
    type: String,
    unique: true,
    index: true
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

  address: {
    type: String,
    trim: true
  },

  gstNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  website: {
    type: String,
    trim: true
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);