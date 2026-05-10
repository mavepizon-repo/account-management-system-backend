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
    required: true,
    index: true
  },

  date: {
    type: Date,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  notes: {
    type: String,
    trim: true,
    default: ""
  },

  // Products stored directly inside invoice
  products: [
    {
      serialNo: {
        type: Number
      },

      description: {
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

      netTotal: {
        type: Number,
        default: 0
      }
    }
  ],

  totalAmount: {
    type: Number,
    default: 0
  },

  totalGST: {
    type: Number,
    default: 0
  },

  grandTotal: {
    type: Number,
    default: 0
  },

  cumulativePaidAmount: {
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