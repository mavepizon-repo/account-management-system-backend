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
      }
    }
  ],

  totalAmount: {
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
    enum: ["Unpaid", "Partial", "Paid", "AdvancePayment"],
    default: "Unpaid"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);