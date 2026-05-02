const Purchase = require("../../models/vendor/Purchase");


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

    const paidAmount = 0;

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
      paidAmount,
      paymentStatus: "Unpaid"
    });

    const savedPurchase = await purchase.save();

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

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.purchaseId,
      { date, invoiceDate, subject, notes },
      { new: true }
    ).populate("vendor", "vendorCode name");

    if (!updatedPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.status(200).json({
      message: "Purchase Updated Successfully",
      data: updatedPurchase
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
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

    await Purchase.findByIdAndDelete(req.params.purchaseId);

    res.status(200).json({
      message: "Purchase Deleted Successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};