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

    // Check if vendor exists
    const vendorExists = await Vendor.findById(vendor);

    if (!vendorExists) {
      return res.status(404).json({
        message: "Vendor not found"
      });
    }


    const cumulativePaidAmount = 0;

    // AUTO SNO GENERATION
    const lastPurchase = await Purchase.findOne().sort({ createdAt: -1 });

    let sno = "PUR0001";

    if (lastPurchase && lastPurchase.sno) {
      const num = parseInt(lastPurchase.sno.substring(3)) + 1;
      sno = "PUR" + String(num).padStart(4, "0");
    }

    let totalAmount = 0;
    let totalGST = 0;
    let grandTotal = 0;

    const productList = products.map((item, index) => {

      const amount = item.quantity * item.rate;
      const gstPercent = item.gstPercent || 0;
      const gstAmount = (amount * gstPercent) / 100;
      const netTotal = amount + gstAmount;

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
      paymentStatus: "Unpaid"
    });

    const savedPurchase = await purchase.save();

    // ===============================
    // ADJUST ADVANCE VOUCHERS
    // ===============================

    let outstandingAmount =
    savedPurchase.grandTotal - savedPurchase.cumulativePaidAmount;

    // Find advance vouchers for this vendor
    const advanceVouchers = await Voucher.find({
      vendor: vendor,
      purchase: null
    }).sort({ createdAt: 1 });

    for (const voucher of advanceVouchers) {

      if (outstandingAmount <= 0) break;

      // Case 1: Voucher fully usable
      if (voucher.amount <= outstandingAmount) {

        voucher.purchase = savedPurchase._id;
        await voucher.save();

        outstandingAmount -= voucher.amount;

      }

      // Case 2: Voucher larger than required (split voucher)
      else {

        const usedAmount = outstandingAmount;
        const remainingVoucherAmount = voucher.amount - usedAmount;

        // Update existing voucher for purchase
        voucher.amount = usedAmount;
        voucher.purchase = savedPurchase._id;

        await voucher.save();

        // Create new advance voucher for remaining amount in the old voucher
        const newVoucher = new Voucher({
          voucherNumber: voucher.voucherNumber + "-A",
          vendor: voucher.vendor,
          receiverType: voucher.receiverType,
          receiver: voucher.receiver,
          purpose: voucher.purpose,
          amount: remainingVoucherAmount,
          paymentMethod: voucher.paymentMethod,
          purchase: null,
          notes: "Advance balance from voucher split"
        });

        await newVoucher.save();

        outstandingAmount = 0;
      }
    }

    // Update PURCHASE BILL payment status
    savedPurchase.cumulativePaidAmount =
      savedPurchase.grandTotal - outstandingAmount;

    if (savedPurchase.cumulativePaidAmount === 0)
      savedPurchase.paymentStatus = "Unpaid";
    else if (savedPurchase.cumulativePaidAmount < savedPurchase.grandTotal)
      savedPurchase.paymentStatus = "Partial";
    else
      savedPurchase.paymentStatus = "Paid";

    await savedPurchase.save();

    res.status(201).json({
      message: "Purchase Created Successfully",
      data: savedPurchase
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating purchase",
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

    const { date, invoiceDate, subject, notes } = req.body;

    const updateData = {};

    if (date) updateData.date = date;
    if (invoiceDate) updateData.invoiceDate = invoiceDate;
    if (subject) updateData.subject = subject;
    if (notes) updateData.notes = notes;

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.purchaseId,
      { $set: updateData },
      {
        new: true,
        runValidators: true
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
      message: error.message
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
      return res.status(404).json({ message: "Purchase not found" });
    }

    let totalAmount = 0;
    let totalGST = 0;
    let grandTotal = 0;

    const updatedProducts = products.map((item, index) => {

      const amount = item.quantity * item.rate;
      const gstPercent = item.gstPercent || 0;
      const gstAmount = (amount * gstPercent) / 100;
      const netTotal = amount + gstAmount;

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

     // Prevent overpaid situation
    const vouchers = await Voucher.find({ purchase: purchase._id }).sort({ createdAt: 1 });

    let remainingBillAmount = grandTotal;
    let newCumulativePaidAmount = 0;

    for (const voucher of vouchers) {

      if (remainingBillAmount <= 0) {

        // Entire voucher becomes advance
        voucher.purchase = null;
        await voucher.save();
        continue;
      }

      if (voucher.amount <= remainingBillAmount) {

        remainingBillAmount -= voucher.amount;
        newCumulativePaidAmount += voucher.amount;

      } else {

        // Split voucher
        const usedAmount = remainingBillAmount;
        const advanceAmount = voucher.amount - usedAmount;

        voucher.amount = usedAmount;
        await voucher.save();

        const newVoucher = new Voucher({
          voucherNumber: voucher.voucherNumber + "-SPLIT",
          vendor: voucher.vendor,
          receiverType: voucher.receiverType,
          receiver: voucher.receiver,
          purpose: "Advance balance after purchase update",
          amount: advanceAmount,
          paymentMethod: voucher.paymentMethod,
          notes: "Auto created advance after purchase reduction"
        });

        await newVoucher.save();

        newCumulativePaidAmount += usedAmount;
        remainingBillAmount = 0;
      }
    }

    purchase.cumulativePaidAmount = newCumulativePaidAmount;

    if (purchase.cumulativePaidAmount === 0)
      purchase.paymentStatus = "Unpaid";
    else if (purchase.cumulativePaidAmount < grandTotal)
      purchase.paymentStatus = "Partial";
    else
      purchase.paymentStatus = "Paid";

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

    const purchase = await Purchase.findById(req.params.purchaseId);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // ===============================
    // REVERT VOUCHERS TO ADVANCE
    // ===============================

    const vouchers = await Voucher.find({ purchase: purchase._id });

    for (const voucher of vouchers) {
      voucher.purchase = null;
      await voucher.save();
    }

    // ===============================
    // DELETE PURCHASE
    // ===============================

    await Purchase.findByIdAndDelete(req.params.purchaseId);

    res.status(200).json({
      message: "Purchase Deleted Successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};