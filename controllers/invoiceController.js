const Invoice = require("../models/Invoice");


// CREATE INVOICE
exports.createInvoice = async (req, res) => {
  try {

    const {
      client,
      date,
      subject,
      notes,
      products = [],
      paidAmount = 0
    } = req.body;

    // AUTO GENERATE INVOICE NUMBER
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });

    let invoiceNumber = "INV0001";

    if (lastInvoice && lastInvoice.invoiceNumber) {
      const num = parseInt(lastInvoice.invoiceNumber.substring(3)) + 1;
      invoiceNumber = "INV" + String(num).padStart(4, "0");
    }

    // PROCESS PRODUCTS
    let totalAmount = 0;

    const productList = products.map((item, index) => {

      const amount = item.quantity * item.rate;
      totalAmount += amount;

      return {
        serialNo: index + 1,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount
      };
    });

    const grandTotal = totalAmount;
    const paid = Number(paidAmount);

    // PAYMENT STATUS
    let paymentStatus = "Unpaid";

    if (paid > grandTotal) {
      paymentStatus = "AdvancePayment";
    } 
    else if (paid === grandTotal && grandTotal > 0) {
      paymentStatus = "Paid";
    } 
    else if (paid > 0 && paid < grandTotal) {
      paymentStatus = "Partial";
    }

    const invoice = new Invoice({
      invoiceNumber,
      client,
      date,
      subject,
      notes,
      products: productList,
      totalAmount,
      grandTotal,
      paidAmount: paid,
      paymentStatus
    });

    const savedInvoice = await invoice.save();

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

    const updatedProducts = products.map((item, index) => {

      const amount = item.quantity * item.rate;
      totalAmount += amount;

      return {
        serialNo: index + 1,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount
      };
    });

    invoice.products = updatedProducts;
    invoice.totalAmount = totalAmount;
    invoice.grandTotal = totalAmount;

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

    await Invoice.findByIdAndDelete(req.params.invoiceId);

    res.status(200).json({
      message: "Invoice Deleted Successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};