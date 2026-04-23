// const mongoose = require("mongoose");

// const voucherSchema = new mongoose.Schema({
//   voucherNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },

//   date: {
//     type: Date,
//     default: Date.now
//   },

//   receiverName: {
//     type: String,
//     required: true
//   },

//   purpose: {
//     type: String,
//     required: true
//   },

//   amount: {
//     type: Number,
//     required: true
//   },

//   paymentMethod: {
//     type: String,
//     enum: ["cash", "online"],
//     default: "cash"
//   },

//   pdfUrl: {
//     type: String
//   }

// }, { timestamps: true });

// module.exports = mongoose.model("Voucher", voucherSchema);

const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({

  voucherNumber: {
    type: String,
    unique: true,
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  receiverType: {
    type: String,
    enum: ["vendor", "subcontractor"],
    required: true
  },

  receiverName: {
    type: String,
    required: true
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

  paidAmount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  
  pdfUrl: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Voucher", voucherSchema);