const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
{
  appliedInvoices: [
    {
      invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice"
      },

      usedAmount: {
        type: Number,
        default: 0
      }
    }
  ],

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