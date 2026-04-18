const Invoice = require("../models/Invoice");
const Client = require("../models/Client");


// CREATE INVOICE
exports.createInvoice = async (req, res) => {
  try {

    const {
      client,
      date,
      project,
      quantity,
      rate,
      amount,
      gst,
      gstAmount,
      grandTotal,
      paidAmount = 0
    } = req.body;

    // 🔥 AUTO INVOICE NUMBER
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });

    let invoiceNumber = "INV0001";

    if (lastInvoice && lastInvoice.invoiceNumber) {
      const num = parseInt(lastInvoice.invoiceNumber.substring(3)) + 1;
      invoiceNumber = "INV" + String(num).padStart(4, "0");
    }

    // Convert values (IMPORTANT SAFE STEP)
    const paid = Number(paidAmount);
    const total = Number(grandTotal);

    // Determine payment status
    let paymentStatus = "Unpaid";

    if (paid > 0 && paid < total) {
      paymentStatus = "Partial";
    } 
    else if (paid >= total) {
      paymentStatus = "Paid";
    }

    const invoice = new Invoice({
      invoiceNumber, // 🔥 ADD THIS
      client,
      date,
      project,
      quantity,
      rate,
      amount,
      gst,
      gstAmount,
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


exports.getInvoicesByClientId = async (req, res) => {
  try {

    const clientId = req.params.clientId;

    const invoices = await Invoice.find({ client: clientId })
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

    const paymentStatus = req.params.paymentStatus; // Unpaid / Partial / Paid

    const invoices = await Invoice.find({ paymentStatus: paymentStatus })
      .populate("client", "clientCode name");

    res.status(200).json({
      count: invoices.length,
      data: invoices
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoices by status",
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


// UPDATE INVOICE
exports.updateInvoice = async (req, res) => {
  try {

    const {
      client,
      date,
      project,
      quantity,
      rate,
      amount,
      gst,
      gstAmount,
      grandTotal,
      paidAmount = 0
    } = req.body;

    let paymentStatus = "Unpaid";

    if (paidAmount > 0 && paidAmount < grandTotal) {
      paymentStatus = "Partial";
    } 
    else if (paidAmount >= grandTotal) {
      paymentStatus = "Paid";
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        client,
        date,
        project,
        quantity,
        rate,
        amount,
        gst,
        gstAmount,
        grandTotal,
        paidAmount,
        paymentStatus
      },
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


// DELETE INVOICE
exports.deleteInvoice = async (req, res) => {
  try {

    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!deletedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({
      message: "Invoice Deleted Successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

