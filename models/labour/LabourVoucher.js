const mongoose = require("mongoose");

const labourVoucherSchema = new mongoose.Schema(
{
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labour",
    required: true
  },

  // ===============================
  // DATE RANGE
  // ===============================

  fromDate: {
    type: Date,
    required: true
  },

  toDate: {
    type: Date,
    required: true
  },

  // Optional
  month: Number,
  year: Number,

  // ===============================
  // WORK DETAILS
  // ===============================

  totalWorkingDays: {
    type: Number,
    default: 0
  },

  totalWorkingHours: {
    type: Number,
    default: 0
  },

  overtimeHours: {
    type: Number,
    default: 0
  },

  // ===============================
  // SALARY
  // ===============================

  totalSalary: {
    type: Number,
    required: true
  },

  // Total advances till now
  totalAdvanceGiven: {
    type: Number,
    default: 0
  },

  // Deducted in THIS voucher
  deductedAdvanceAmount: {
    type: Number,
    default: 0
  },

  remainingAdvanceAmount: {
    type: Number,
    default: 0
  },

  payableSalary: {
    type: Number,
    required: true
  },

  // ===============================
  // PDF
  // ===============================

  voucherPdf: {
    url: String,
    public_id: String
  }

},
{ timestamps: true }
);

// Prevent duplicate same range
labourVoucherSchema.index(
  {
    labour: 1,
    fromDate: 1,
    toDate: 1
  },
  { unique: true }
);

module.exports = mongoose.model(
  "LabourVoucher",
  labourVoucherSchema
);