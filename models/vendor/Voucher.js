const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({

  voucherNumber: {
    type: String,
    unique: true,
    trim: true
  },

  // =====================================================
  // VENDOR FLOW
  // =====================================================

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    default: null,
    index: true
  },

  appliedPurchases: {
    type: [
      {
        purchase: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Purchase"
        },

        usedAmount: {
          type: Number,
          default: 0
        }
      }
    ],
    default: []
  },

  // =====================================================
  // SUBCONTRACT FLOW
  // =====================================================

  subcontract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcontract",
    default: null,
    index: true
  },

  appliedWorkSubcontracts: {
    type: [
      {
        workSubcontract: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "WorkSubcontract"
        },

        usedAmount: {
          type: Number,
          default: 0
        }
      }
    ],
    default: []
  },

  // =====================================================
  // RECEIVER DETAILS
  // =====================================================

  receiverType: {
    type: String,
    enum: ["Vendor", "Subcontract"],
    required: true
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "receiverType",
    index: true
  },

  // =====================================================
  // PAYMENT DETAILS
  // =====================================================

  date: {
    type: Date,
    default: Date.now,
    index: true
  },

  purpose: {
    type: String,
    required: true,
    trim: true
  },

  amountInVoucher: {
    type: Number,
    required: true,
    min: 0
  },

  // Remaining advance amount available
  remainingAmount: {
    type: Number,
    default: function () {
      return this.amountInVoucher;
    },
    min: 0
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "online"],
    default: "cash"
  },

  notes: {
    type: String,
    default: "",
    trim: true
  },

  // =====================================================
  // PDF
  // =====================================================

  pdfUrl: {
    type: String,
    default: ""
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Voucher", voucherSchema);