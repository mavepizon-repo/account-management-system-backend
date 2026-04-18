const mongoose = require("mongoose");

const subcontractSchema = new mongoose.Schema({
  subcontractCode: {
    type: String,
    unique: true,
    index: true
  },

  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  email: {
    type: String
  },

  address: {
    type: String
  },

  companyName: {
    type: String
  },

  skillType: {
    type: String
  },

  gstNumber: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Subcontract", subcontractSchema);