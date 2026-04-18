// const mongoose = require('mongoose');   // ✅ MUST ADD

// const purchaseSchema = new mongoose.Schema({
//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor',
//     required: true
//   },
//   invoiceNo: {
//     type: String,
//     required: true
//   },
//   purpose: String,
//   totalPayment: {
//     type: Number,
//     required: true
//   },
//   gstInput: {
//     type: Number,
//     default: 0
//   },
//   netTotal: Number,

//   paidAmount: {
//     type: Number,
//     default: 0
//   },

//   status: {
//     type: String,
//     enum: ['unpaid', 'partial', 'paid'],
//     default: 'unpaid'
//   }

// }, { timestamps: true });

// module.exports = mongoose.model('Purchase', purchaseSchema);

// const mongoose = require('mongoose');

// const purchaseSchema = new mongoose.Schema({
//   purchaseCode: {
//     type: String,
//     unique: true
//   },

//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor',
//     required: true
//   },

//   invoiceNo: {
//     type: String,
//     required: true
//   },

//   purpose: String,

//   totalPayment: {
//     type: Number,
//     required: true
//   },

//   gstInput: {
//     type: Number,
//     default: 0
//   },

//   netTotal: Number,

//   paidAmount: {
//     type: Number,
//     default: 0
//   },

//   status: {
//     type: String,
//     enum: ['unpaid', 'partial', 'paid'],
//     default: 'unpaid'
//   }

// }, { timestamps: true });

// module.exports = mongoose.model('Purchase', purchaseSchema);


// ================================
// const mongoose = require('mongoose');

// const purchaseSchema = new mongoose.Schema({
//   purchaseCode: {
//     type: String,
//     unique: true
//   },

//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor',
//     required: true
//   },

//   invoiceNo: {
//     type: String,
//     required: true
//   },

//   purpose: String,

//   totalPayment: {
//     type: Number,
//     required: true
//   },

//   gstInput: {
//     type: Number,
//     default: 0
//   },

//   netTotal: Number,

//   paidAmount: {
//     type: Number,
//     default: 0
//   },

//   status: {
//     type: String,
//     enum: ['unpaid', 'partial', 'paid'],
//     default: 'unpaid'
//   }

// }, { timestamps: true });

// module.exports = mongoose.model('Purchase', purchaseSchema);


// ==========================
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseCode: {
    type: String,
    unique: true
  },

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },

  invoiceNo: {
    type: String,
    required: true
  },

  purpose: String,

  totalPayment: {
    type: Number,
    required: true
  },

  gstInput: {
    type: Number,
    default: 0
  },

  netTotal: Number,

  paidAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  }

}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);