const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
{
   invoiceNumber: {
    type: String,
    unique: true,
    index: true
  },
  
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true
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
    required: true,
    min: 0
  },

  rate: {
    type: Number,
    required: true,
    min: 0
  },

  amount: {
    type: Number,
    default: 0
  },

  gst: {
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