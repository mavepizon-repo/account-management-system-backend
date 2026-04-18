// const Purchase = require('../models/Purchase');
// // ✅ CREATE PURCHASE
// exports.createPurchase = async (req, res) => {
//   try {

//     // ✅ get data from body
//     const { vendor, invoiceNo, purpose, totalPayment, gstInput } = req.body;

//     // ✅ calculate net total
//     const netTotal = totalPayment + (gstInput || 0);

//     const purchase = new Purchase({
//       vendor,
//       invoiceNo,
//       purpose,
//       totalPayment,
//       gstInput,
//       netTotal
//     });

//     const saved = await purchase.save();

//     res.status(201).json(saved);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // ✅ GET ALL PURCHASES
// exports.getPurchases = async (req, res) => {
//   try {

//     const purchases = await Purchase.find().populate('vendor', 'name');

//     res.json(purchases);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // ✅ GET BY VENDOR
// exports.getPurchasesByVendor = async (req, res) => {
//   try {

//     const purchases = await Purchase.find({
//       vendor: req.params.vendorId
//     });

//     res.json(purchases);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // ✅ UPDATE PAYMENT (your code 👍)
// exports.updatePayment = async (req, res) => {
//   try {

//     const purchase = await Purchase.findById(req.params.id);

//     const newPaid = purchase.paidAmount + req.body.amount;

//     let status = 'unpaid';

//     if (newPaid === purchase.netTotal) {
//       status = 'paid';
//     } else if (newPaid > 0) {
//       status = 'partial';
//     }

//     purchase.paidAmount = newPaid;
//     purchase.status = status;

//     await purchase.save();

//     res.json(purchase);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// ====================
// const Purchase = require('../models/Purchase');
// const Vendor = require('../models/Vendor');


// // ✅ CREATE PURCHASE BILL
// exports.createPurchase = async (req, res) => {
//   try {

//     const { vendor, invoiceNo, purpose, totalPayment, gstInput } = req.body;

//     // 🔥 Check vendor exists
//     const vendorExists = await Vendor.findById(vendor);
//     if (!vendorExists) {
//       return res.status(400).json({ message: "Invalid Vendor ID" });
//     }

//     // 🔥 Generate Purchase Code
//     const lastPurchase = await Purchase.findOne().sort({ createdAt: -1 });

//     let purchaseCode = "PC001";

//     if (lastPurchase && lastPurchase.purchaseCode) {
//       const num = parseInt(lastPurchase.purchaseCode.substring(2)) + 1;
//       purchaseCode = "PC" + String(num).padStart(3, "0");
//     }

//     // 🔥 Calculate net total
//     const netTotal = totalPayment + (gstInput || 0);

//     const purchase = new Purchase({
//       purchaseCode,
//       vendor,
//       invoiceNo,
//       purpose,
//       totalPayment,
//       gstInput,
//       netTotal
//     });

//     const saved = await purchase.save();

//     res.status(201).json(saved);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // ✅ GET ALL (with vendor name auto 🔥)
// exports.getPurchases = async (req, res) => {
//   try {

//     const purchases = await Purchase.find()
//       .populate('vendor', 'name vendorCode');

//     res.json(purchases);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // ✅ GET BY VENDOR
// exports.getPurchasesByVendor = async (req, res) => {
//   try {

//     const purchases = await Purchase.find({
//       vendor: req.params.vendorId
//     }).populate('vendor', 'name vendorCode');

//     res.json(purchases);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // ✅ UPDATE PAYMENT (auto status)
// exports.updatePayment = async (req, res) => {
//   try {

//     const purchase = await Purchase.findById(req.params.id);

//     if (!purchase) {
//       return res.status(404).json({ message: "Purchase not found" });
//     }

//     const newPaid = purchase.paidAmount + req.body.amount;

//     let status = 'unpaid';

//     if (newPaid >= purchase.netTotal) {
//       status = 'paid';
//     } else if (newPaid > 0) {
//       status = 'partial';
//     }

//     purchase.paidAmount = newPaid;
//     purchase.status = status;

//     await purchase.save();

//     res.json(purchase);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ DELETE PURCHASE
// exports.deletePurchase = async (req, res) => {
//   try {

//     const purchase = await Purchase.findById(req.params.id);

//     if (!purchase) {
//       return res.status(404).json({ message: "Purchase not found" });
//     }

//     await Purchase.findByIdAndDelete(req.params.id);

//     res.json({ message: "Purchase deleted successfully" });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// ===========================
const Purchase = require('../models/Purchase');
const Vendor = require('../models/Vendor');


// ✅ CREATE PURCHASE
exports.createPurchase = async (req, res) => {
  try {

    const { vendor, invoiceNo, purpose, totalPayment, gstInput } = req.body;

    // check vendor
    const vendorExists = await Vendor.findById(vendor);
    if (!vendorExists) {
      return res.status(400).json({ message: "Invalid Vendor ID" });
    }

    // generate purchase code
    const last = await Purchase.findOne().sort({ createdAt: -1 });

    let purchaseCode = "PC001";

    if (last && last.purchaseCode) {
      const num = parseInt(last.purchaseCode.substring(2)) + 1;
      purchaseCode = "PC" + String(num).padStart(3, "0");
    }

    const netTotal = totalPayment + (gstInput || 0);

    const purchase = new Purchase({
      purchaseCode,
      vendor,
      invoiceNo,
      purpose,
      totalPayment,
      gstInput,
      netTotal
    });

    const saved = await purchase.save();

    res.status(201).json(saved);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ GET ALL
exports.getPurchases = async (req, res) => {
  try {

    const data = await Purchase.find()
      .populate('vendor', 'name vendorCode');

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ GET SINGLE
exports.getPurchaseById = async (req, res) => {
  try {

    const data = await Purchase.findById(req.params.id)
      .populate('vendor', 'name vendorCode');

    if (!data) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ GET BY VENDOR
exports.getPurchasesByVendor = async (req, res) => {
  try {

    const data = await Purchase.find({
      vendor: req.params.vendorId
    }).populate('vendor', 'name vendorCode');

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ UPDATE PURCHASE (edit bill)
exports.updatePurchase = async (req, res) => {
  try {

    const { totalPayment, gstInput } = req.body;

    let updateData = { ...req.body };

    // recalculate net total if values updated
    if (totalPayment || gstInput) {
      const tp = totalPayment || 0;
      const gst = gstInput || 0;
      updateData.netTotal = tp + gst;
    }

    const updated = await Purchase.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ UPDATE PAYMENT
exports.updatePayment = async (req, res) => {
  try {

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: "Not found" });
    }

    const newPaid = purchase.paidAmount + req.body.amount;

    let status = 'unpaid';

    if (newPaid >= purchase.netTotal) {
      status = 'paid';
    } else if (newPaid > 0) {
      status = 'partial';
    }

    purchase.paidAmount = newPaid;
    purchase.status = status;

    await purchase.save();

    res.json(purchase);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ DELETE
exports.deletePurchase = async (req, res) => {
  try {

    const data = await Purchase.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};