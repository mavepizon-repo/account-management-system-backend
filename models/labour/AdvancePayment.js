const mongoose = require("mongoose");

const advancePaymentSchema = new mongoose.Schema(
{
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labour",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  advanceAmount: {
    type: Number,
    required: true
  },

  receivedStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("AdvancePayment", advancePaymentSchema);