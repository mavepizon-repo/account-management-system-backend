const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
{
  clientCode: {
    type: String,
    required: true,
    ref: "Client"
  },

  date: {
    type: Date,
    required: true
  },

  project: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  rate: {
    type: Number,
    required: true
  },

  amount: {
    type: Number
  },

  gst: {
    type: Number
  },

  gstAmount: {
    type: Number
  },

  grandTotal: {
    type: Number
  },

  paidAmount: {
    type: Number,
    default: 0
  },

  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Partial", "Paid"],
    default: "Unpaid"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);