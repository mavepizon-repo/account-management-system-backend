const mongoose = require("mongoose");

const workSubcontractSchema = new mongoose.Schema({

  subcontract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcontract",
    required: true
  },

  projectName: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  startDate: {
    type: Date
  },

  endDate: {
    type: Date
  },

  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "On Hold"],
    default: "Pending"
  },

  // ===============================
  // AMOUNT DETAILS
  // ===============================

  totalAmount: {
    type: Number,
    required: true
  },

  gstPercent: {
    type: Number,
    default: 0
  },

  gstAmount: {
    type: Number,
    default: 0
  },

  grandTotal: {
    type: Number,
    default: 0
  },

  // ===============================
  // PAYMENT DETAILS
  // ===============================

  cumulativePaidAmount: {
    type: Number,
    default: 0
  },

  balanceAmount: {
    type: Number,
    default: 0
  },

  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Partial", "Paid"],
    default: "Unpaid"
  }

}, { timestamps: true });

module.exports = mongoose.model("WorkSubcontract", workSubcontractSchema);