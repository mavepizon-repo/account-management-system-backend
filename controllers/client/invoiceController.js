const Invoice = require("../../models/client/Invoice");
const Receipt = require("../../models/client/Receipt");

// CREATE INVOICE
exports.createInvoice = async (req, res) => {
  try {

    const {
      client,
      date,
      subject,
      notes,
      products = []
    } = req.body;

    // ALWAYS START WITH 0
    const cumulativePaidAmount = 0;

    // AUTO INVOICE NUMBER
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });

    let invoiceNumber = "INV0001";

    if (lastInvoice && lastInvoice.invoiceNumber) {
      const num = parseInt(lastInvoice.invoiceNumber.substring(3)) + 1;
      invoiceNumber = "INV" + String(num).padStart(4, "0");
    }

    // PROCESS PRODUCTS
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

    // PAYMENT STATUS (always Unpaid initially)
    let paymentStatus = "Unpaid";

    const invoice = new Invoice({
      invoiceNumber,
      client,
      date,
      subject,
      notes,
      products: productList,
      totalAmount,
      totalGST,
      grandTotal,
      cumulativePaidAmount,
      paymentStatus
    });

    const savedInvoice = await invoice.save();

    // find all the receipts which are for the particular client
    // ===============================
    // APPLY ADVANCE RECEIPTS
    // ===============================

    const advanceReceipts = await Receipt.find({
      client: client,
      invoice: null,
      remainingAmount: { $gt: 0 }
    }).sort({ paymentDate: 1 });

    let remaining = savedInvoice.grandTotal;

    for (const r of advanceReceipts) {

      if (remaining <= 0) break;

      const applyAmount = Math.min(r.remainingAmount, remaining);

      r.remainingAmount -= applyAmount;

      remaining -= applyAmount;

      // if receipt fully consumed
      if (r.remainingAmount === 0) {
        r.invoice = savedInvoice._id;
      }

      await r.save();
    }

    // Update invoice paid amount
    const paidAmount = savedInvoice.grandTotal - remaining;
    savedInvoice.cumulativePaidAmount = paidAmount;

    // Update payment status
    if (paidAmount === 0) {
      savedInvoice.paymentStatus = "Unpaid";
    }
    else if (paidAmount < savedInvoice.grandTotal) {
      savedInvoice.paymentStatus = "Partial";
    }
    else {
      savedInvoice.paymentStatus = "Paid";
    }

    await savedInvoice.save();

    res.status(201).json({
      message: "Invoice Created Successfully",
      data: savedInvoice
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating invoice",
      error: error.message
    });
  }
};



// GET ALL INVOICES
exports.getAllInvoices = async (req, res) => {
  try {

    const invoices = await Invoice.find()
      .populate("client", "clientCode name");

    res.status(200).json({
      count: invoices.length,
      data: invoices
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// GET INVOICE BY ID
exports.getInvoiceByInvoiceId = async (req, res) => {
  try {

    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate("client", "clientCode name");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({
      data: invoice
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// GET INVOICES BY CLIENT ID
exports.getInvoicesByClientId = async (req, res) => {
  try {

    const invoices = await Invoice.find({ client: req.params.clientId })
      .populate("client", "clientCode name");

    res.status(200).json({
      count: invoices.length,
      data: invoices
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoices",
      error: error.message
    });
  }
};



// GET INVOICES BY PAYMENT STATUS
exports.getInvoicesByStatus = async (req, res) => {
  try {

    const invoices = await Invoice.find({
      paymentStatus: req.params.paymentStatus
    }).populate("client", "clientCode name");

    res.status(200).json({
      count: invoices.length,
      data: invoices
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoices",
      error: error.message
    });
  }
};

// GET INVOICES BY CLIENT ID AND PAYMENT STATUS
exports.getInvoicesByClientAndStatus = async (req, res) => {
  try {

    const { clientId, paymentStatus } = req.params;

    const invoices = await Invoice.find({
      client: clientId,
      paymentStatus: paymentStatus
    }).populate("client", "clientCode name");

    res.status(200).json({
      count: invoices.length,
      data: invoices
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoices",
      error: error.message
    });
  }
};


// UPDATE INVOICE BASIC DETAILS
exports.updateInvoiceByInvoiceId = async (req, res) => {
  try {

    const { date, subject, notes } = req.body;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.invoiceId,
      { date, subject, notes },
      { new: true }
    ).populate("client", "clientCode name");

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({
      message: "Invoice Updated Successfully",
      data: updatedInvoice
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// UPDATE PRODUCTS IN AN INVOICE
exports.updateInvoiceProducts = async (req, res) => {
  try {

    const { invoiceId } = req.params;
    const { products } = req.body;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
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

    invoice.products = updatedProducts;
    invoice.totalAmount = totalAmount;
    invoice.totalGST = totalGST;
    invoice.grandTotal = grandTotal;

    // If paid amount exceeds new invoice total
    if (invoice.cumulativePaidAmount > invoice.grandTotal) {
      return res.status(400).json({ message: "Invoice total cannot be less than already paid amount" });
    }

    // Recalculate payment status
    if (invoice.cumulativePaidAmount === 0) {
      invoice.paymentStatus = "Unpaid";
    }
    else if (invoice.cumulativePaidAmount < invoice.grandTotal) {
      invoice.paymentStatus = "Partial";
    }
    else {
      invoice.paymentStatus = "Paid";
    }

    await invoice.save();

    res.status(200).json({
      message: "Products updated successfully",
      data: invoice
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating products",
      error: error.message
    });
  }
};



// DELETE INVOICE
exports.deleteInvoice = async (req, res) => {
  try {

    const invoice = await Invoice.findById(req.params.invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Prevent deleting invoice if payments exist
    if (invoice.cumulativePaidAmount > 0) {
      return res.status(400).json({
        message: "Cannot delete invoice with existing payments"
      });
    }

    // Unlink receipts (safety cleanup)
    await Receipt.updateMany(
      { invoice: req.params.invoiceId },
      { $set: { invoice: null } }
    );

    // Delete invoice
    await Invoice.findByIdAndDelete(req.params.invoiceId);

    res.status(200).json({
      message: "Invoice Deleted Successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting invoice",
      error: error.message
    });
  }
};