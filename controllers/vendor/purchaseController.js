const Purchase = require("../../models/vendor/Purchase");
const Vendor = require("../../models/vendor/Vendor");
const Voucher = require("../../models/vendor/Voucher");


// CREATE PURCHASE
exports.createPurchase = async (req, res) => {

  try {

    const {
      vendor,
      date,
      invoiceDate,
      subject,
      notes,
      products = []
    } = req.body;

    // ===============================
    // CHECK VENDOR
    // ===============================

    const vendorExists =
      await Vendor.findById(vendor);

    if (!vendorExists) {

      return res.status(404).json({
        message: "Vendor not found"
      });

    }

    // ===============================
    // ALWAYS START WITH 0
    // ===============================

    const cumulativePaidAmount = 0;

    // ===============================
    // AUTO PURCHASE NUMBER
    // ===============================

    const lastPurchase =
      await Purchase.findOne()
      .sort({ createdAt: -1 });

    let sno = "PUR0001";

    if (
      lastPurchase &&
      lastPurchase.sno
    ) {

      const num =
        parseInt(
          lastPurchase.sno.substring(3)
        ) + 1;

      sno =
        "PUR" +
        String(num).padStart(4, "0");
    }

    // ===============================
    // PROCESS PRODUCTS
    // ===============================

    let totalAmount = 0;
    let totalGST = 0;
    let grandTotal = 0;

    const productList = products.map(
      (item, index) => {

        const amount =
          item.quantity * item.rate;

        const gstPercent =
          item.gstPercent || 0;

        const gstAmount =
          (amount * gstPercent) / 100;

        const netTotal =
          amount + gstAmount;

        totalAmount += amount;
        totalGST += gstAmount;
        grandTotal += netTotal;

        return {

          serialNo: index + 1,

          description:
            item.description,

          quantity:
            item.quantity,

          rate:
            item.rate,

          amount,

          gstPercent,

          gstAmount,

          netTotal
        };

      }
    );

    // ===============================
    // PAYMENT STATUS
    // ===============================

    let paymentStatus = "Unpaid";

    // ===============================
    // CREATE PURCHASE
    // ===============================

    const purchase = new Purchase({

      sno,

      vendor,

      date,

      invoiceDate,

      subject,

      notes,

      products: productList,

      totalAmount,

      totalGST,

      grandTotal,

      cumulativePaidAmount,

      paymentStatus

    });

    const savedPurchase =
      await purchase.save();

    // ===============================
    // APPLY ADVANCE VOUCHERS
    // ===============================

    const advanceVouchers =
      await Voucher.find({

        vendor: vendor,

        remainingAmount: { $gt: 0 }

      }).sort({ createdAt: 1 });

    // Outstanding amount in purchase
    let remaining =
      savedPurchase.grandTotal;

    for (const voucher of advanceVouchers) {

      if (remaining <= 0) break;

      // usable amount from voucher
      const applyAmount = Math.min(
        voucher.remainingAmount,
        remaining
      );

      // reduce voucher balance
      voucher.remainingAmount -= applyAmount;

      // reduce purchase balance
      remaining -= applyAmount;

      // store purchase mapping
      voucher.appliedPurchases.push({

        purchase: savedPurchase._id,

        usedAmount: applyAmount

      });

      await voucher.save();

    }

    // ===============================
    // UPDATE PURCHASE PAID AMOUNT
    // ===============================

    const paidAmount =
      savedPurchase.grandTotal -
      remaining;

    savedPurchase.cumulativePaidAmount =
      paidAmount;

    // ===============================
    // UPDATE PAYMENT STATUS
    // ===============================

    if (paidAmount === 0) {

      savedPurchase.paymentStatus =
        "Unpaid";

    }

    else if (
      paidAmount <
      savedPurchase.grandTotal
    ) {

      savedPurchase.paymentStatus =
        "Partial";

    }

    else {

      savedPurchase.paymentStatus =
        "Paid";

    }

    await savedPurchase.save();

    res.status(201).json({

      message:
        "Purchase Created Successfully",

      data: savedPurchase

    });

  }

  catch (error) {

    res.status(500).json({

      message:
        "Error creating purchase",

      error: error.message

    });

  }

};



// GET ALL PURCHASES
exports.getAllPurchases = async (req, res) => {
  try {

    const purchases = await Purchase.find()
      .populate("vendor", "vendorCode name");

    res.status(200).json({
      count: purchases.length,
      data: purchases
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// GET PURCHASE BY ID
exports.getPurchaseById = async (req, res) => {
  try {

    const purchase = await Purchase.findById(req.params.purchaseId)
      .populate("vendor", "vendorCode name");

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.status(200).json({
      data: purchase
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// GET PURCHASES BY VENDOR ID
exports.getPurchasesByVendorId = async (req, res) => {
  try {

    const purchases = await Purchase.find({ vendor: req.params.vendorId })
      .populate("vendor", "vendorCode name");

    res.status(200).json({
      count: purchases.length,
      data: purchases
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching purchases",
      error: error.message
    });
  }
};



// GET PURCHASES BY PAYMENT STATUS
exports.getPurchasesByStatus = async (req, res) => {
  try {

    const purchases = await Purchase.find({
      paymentStatus: req.params.paymentStatus
    }).populate("vendor", "vendorCode name");

    res.status(200).json({
      count: purchases.length,
      data: purchases
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching purchases",
      error: error.message
    });
  }
};



// GET PURCHASES BY STATUS + VENDOR ID
exports.getPurchasesByStatusAndVendor = async (req, res) => {
  try {

    const { paymentStatus, vendorId } = req.params;

    const purchases = await Purchase.find({
      paymentStatus,
      vendor: vendorId
    }).populate("vendor", "vendorCode name");

    res.status(200).json({
      count: purchases.length,
      data: purchases
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching purchases",
      error: error.message
    });
  }
};



// UPDATE PURCHASE (BASIC DETAILS)
exports.updatePurchase = async (req, res) => {
  try {

    const {
      date,
      invoiceDate,
      subject,
      notes
    } = req.body;

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.purchaseId,
      {
        date,
        invoiceDate,
        subject,
        notes
      },
      {
        new: true
      }
    ).populate("vendor", "vendorCode name");

    if (!updatedPurchase) {

      return res.status(404).json({
        message: "Purchase not found"
      });

    }

    res.status(200).json({
      message: "Purchase Updated Successfully",
      data: updatedPurchase
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



// UPDATE PURCHASE PRODUCTS
exports.updatePurchaseProducts = async (req, res) => {
  try {

    const { purchaseId } = req.params;
    const { products } = req.body;

    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {

      return res.status(404).json({
        message: "Purchase not found"
      });

    }

    let totalAmount = 0;
    let totalGST = 0;
    let grandTotal = 0;

    const updatedProducts = products.map((item, index) => {

      const amount =
        item.quantity * item.rate;

      const gstPercent =
        item.gstPercent || 0;

      const gstAmount =
        (amount * gstPercent) / 100;

      const netTotal =
        amount + gstAmount;

      totalAmount += amount;
      totalGST += gstAmount;
      grandTotal += netTotal;

      return {

        serialNo: index + 1,

        description: item.description,

        quantity: item.quantity,

        rate: item.rate,

        amount,

        gstPercent,

        gstAmount,

        netTotal

      };

    });

    purchase.products = updatedProducts;

    purchase.totalAmount = totalAmount;

    purchase.totalGST = totalGST;

    purchase.grandTotal = grandTotal;

    // ===============================
    // VALIDATE PAID AMOUNT
    // ===============================

    if (
      purchase.cumulativePaidAmount >
      purchase.grandTotal
    ) {

      return res.status(400).json({
        message:
          "Purchase total cannot be less than already paid amount"
      });

    }

    // ===============================
    // RECALCULATE PAYMENT STATUS
    // ===============================

    if (
      purchase.cumulativePaidAmount === 0
    ) {

      purchase.paymentStatus = "Unpaid";

    }

    else if (
      purchase.cumulativePaidAmount <
      purchase.grandTotal
    ) {

      purchase.paymentStatus = "Partial";

    }

    else {

      purchase.paymentStatus = "Paid";

    }

    await purchase.save();

    res.status(200).json({
      message: "Products updated successfully",
      data: purchase
    });

  } catch (error) {

    res.status(500).json({
      message: "Error updating products",
      error: error.message
    });

  }
};



// DELETE PURCHASE
exports.deletePurchase = async (req, res) => {
  try {

    const purchase = await Purchase.findById(
      req.params.purchaseId
    );

    if (!purchase) {

      return res.status(404).json({
        message: "Purchase not found"
      });

    }

    // ===============================
    // PREVENT DELETE IF PAYMENT EXISTS
    // ===============================

    if (purchase.cumulativePaidAmount > 0) {

      return res.status(400).json({
        message:
          "Cannot delete purchase with existing payments"
      });

    }

    // ===============================
    // UNLINK VOUCHERS
    // ===============================

    await Voucher.updateMany(
      {
        "appliedPurchases.purchase":
          req.params.purchaseId
      },
      {
        $pull: {
          appliedPurchases: {
            purchase:
              req.params.purchaseId
          }
        }
      }
    );

    // ===============================
    // DELETE PURCHASE
    // ===============================

    await Purchase.findByIdAndDelete(
      req.params.purchaseId
    );

    res.status(200).json({
      message:
        "Purchase Deleted Successfully"
    });

  } catch (error) {

    res.status(500).json({
      message:
        "Error deleting purchase",
      error: error.message
    });

  }
};