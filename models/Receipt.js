const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
{
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: true
  },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true
  },

  amountPaid: {
    type: Number,
    required: true
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  receiptNumber: {
    type: String,
    unique: true
  },

  receiptPdf: {
    type: String   // path of pdf file
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Receipt", receiptSchema);