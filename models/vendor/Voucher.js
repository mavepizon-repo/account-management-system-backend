const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({

  voucherNumber: {
    type: String,
    unique: true
  },

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    default: null
  },

  subcontract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcontract",
    default: null
  },

  receiverType: {
    type: String,
    enum: ["Vendor", "Subcontract"],
    required: true
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "receiverType"
  },

  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchase",
    default: null
  },

  workSubcontract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkSubcontract",
    default: null
  },

  date: {
    type: Date,
    default: Date.now
  },

  purpose: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "online"],
    default: "cash"
  },

  notes: {
    type: String,
    default: ""
  },

  pdfUrl: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Voucher", voucherSchema);


