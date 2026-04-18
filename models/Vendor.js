const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorCode: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  gstNo: String,
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);