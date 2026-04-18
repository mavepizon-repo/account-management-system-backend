const Invoice = require("../models/Invoice");

exports.createInvoice = async (req, res) => {
  try {
    const { clientCode, date, project, quantity, rate, gst, paidAmount } = req.body;

    const amount = quantity * rate;
    const gstAmount = (amount * gst) / 100;
    const grandTotal = amount + gstAmount;

    let paymentStatus = "Unpaid";
    if (paidAmount > 0 && paidAmount < grandTotal) paymentStatus = "Partial";
    if (paidAmount >= grandTotal) paymentStatus = "Paid";

    const invoice = new Invoice({
      clientCode,
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
    });

    const savedInvoice = await invoice.save();

    res.status(201).json({
      message: "Invoice Created Successfully",
      data: savedInvoice
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllInvoices = async (req, res) => {
  try {

    const invoices = await Invoice.find()
      .populate("clientCode");

    res.status(200).json({
      count: invoices.length,
      data: invoices
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getInvoiceById = async (req, res) => {
  try {

    const invoice = await Invoice.findById(req.params.id)
      .populate("clientCode");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {

    const { quantity, rate, gst, paidAmount } = req.body;

    const amount = quantity * rate;
    const gstAmount = (amount * gst) / 100;
    const grandTotal = amount + gstAmount;

    let paymentStatus = "Unpaid";
    if (paidAmount > 0 && paidAmount < grandTotal) paymentStatus = "Partial";
    if (paidAmount >= grandTotal) paymentStatus = "Paid";

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        amount,
        gstAmount,
        grandTotal,
        paymentStatus
      },
      { new: true }
    );

    res.status(200).json({
      message: "Invoice Updated",
      data: updatedInvoice
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


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