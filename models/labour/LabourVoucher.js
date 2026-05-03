const mongoose = require("mongoose");

const labourVoucherSchema = new mongoose.Schema(
{
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labour",
    required: true
  },

  month: {
    type: Number,
    required: true
  },

  year: {
    type: Number,
    required: true
  },

  totalSalary: {
    type: Number,
    required: true
  },

  totalAdvance: {
    type: Number,
    required: true
  },

  payableSalary: {
    type: Number,
    required: true
  },

  voucherPdf: {
    url: { type: String },
    public_id: { type: String }
  }

},
{ timestamps: true }
);

labourVoucherSchema.index(
  { labour: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("LabourVoucher", labourVoucherSchema);