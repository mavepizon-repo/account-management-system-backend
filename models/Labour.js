const mongoose = require("mongoose");

const labourSchema = new mongoose.Schema({
  labourId: {
    type: String,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  workType: {
    type: String
  },

  site: {
    type: String
  },

  dailyWage: {
    type: Number,
    required: true
  },

  daysWorked: {
    type: Number,
    default: 0
  },

  advance: {
    type: Number,
    default: 0
  },

  totalSalary: {
    type: Number,
    default: 0
  },

  balance: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("Labour", labourSchema);