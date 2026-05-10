const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
{
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null,   // changed
    index: true
  },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
    index: true
  },

  paidAmountInReceipt: {
    type: Number,
    required: true,
    min: 1
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  receiptNumber: {
    type: String,
    unique: true,
    index: true
  },

  remainingAmount: {
    type: Number,
    default: function () {
      return this.paidAmountInReceipt;
    }
  },

  description: {
    type: String,
    trim: true,
    default: ""
  },

  receiptPdf: {
    type: String
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Receipt", receiptSchema);