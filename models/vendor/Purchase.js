const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
{
  sno: {
    type: String,
    unique: true,
    index: true
  },

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  invoiceDate: {
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

  products: [
    {
      serialNo: Number,
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      rate: { type: Number, required: true },

      amount: Number,
      gstPercent: { type: Number, default: 0 },
      gstAmount: { type: Number, default: 0 },
      netTotal: Number
    }
  ],

  totalAmount: { type: Number, default: 0 },
  totalGST: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },

  paidAmount: { type: Number, default: 0 },

  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Partial", "Paid", "AdvancePayment"],
    default: "Unpaid"
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);