const mongoose = require("mongoose");

const advancePaymentSchema = new mongoose.Schema(
{
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labour",
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  // =====================================
  // ADVANCE AMOUNT
  // =====================================

  advanceAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // =====================================
  // DEDUCTION TYPE
  // =====================================

  deductionType: {
    type: String,

    enum: [
      "Monthly Installment",
      "Fixed Amount",
      "Custom"
    ],

    required: true
  },

  // =====================================
  // INSTALLMENT
  // =====================================

  // Example:
  // 10000 / 5 months

  installmentMonths: {
    type: Number,
    default: null,
    min: 1
  },

  // =====================================
  // FIXED AMOUNT
  // =====================================

  // Example:
  // deduct 1500 every salary

  fixedDeductionAmount: {
    type: Number,
    default: null,
    min: 0
  },

  // =====================================
  // TRACKING
  // =====================================

  deductedAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  remainingAmount: {
    type: Number,

    default: function () {
      return this.advanceAmount;
    },

    min: 0
  },

  status: {
    type: String,

    enum: [
      "Pending",
      "Partial",
      "Paid"
    ],

    default: "Pending"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model(
  "AdvancePayment",
  advancePaymentSchema
);