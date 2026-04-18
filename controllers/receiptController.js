const cloudinary = require("../config/cloudinary");
const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const Receipt = require("../models/Receipt");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


exports.createReceipt = async (req, res) => {
  try {
    const { invoiceId, amountPaid } = req.body;

    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }

    const invoice = await Invoice.findById(invoiceId).populate("client");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // 🧮 Remaining balance calculation
    const remainingAmount = invoice.grandTotal - invoice.paidAmount;

    // ❌ Prevent overpayment
    if (amountPaid > remainingAmount) {
      return res.status(400).json({
        message: "Payment exceeds remaining balance",
        remainingAmount
      });
    }

    // ✅ Update paid amount safely
    const newPaidAmount = invoice.paidAmount + amountPaid;

    let paymentStatus = "Unpaid";

    if (newPaidAmount > 0 && newPaidAmount < invoice.grandTotal) {
      paymentStatus = "Partial";
    } else if (newPaidAmount === invoice.grandTotal) {
      paymentStatus = "Paid";
    }

    invoice.paidAmount = newPaidAmount;
    invoice.paymentStatus = paymentStatus;

    await invoice.save();

    // 🧾 Receipt number
    const lastReceipt = await Receipt.findOne().sort({ createdAt: -1 });

    let receiptNumber = "RC0001";

    if (lastReceipt && lastReceipt.receiptNumber) {
      const num = parseInt(lastReceipt.receiptNumber.substring(2)) + 1;
      receiptNumber = "RC" + String(num).padStart(4, "0");
    }

    // 📄 PDF generation
    const pdfPath = `./${receiptNumber}.pdf`;
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    doc.fontSize(20).text("Payment Receipt", { align: "center" });
    doc.moveDown();

    doc.text(`Receipt No: ${receiptNumber}`);
    doc.text(`Client: ${invoice.client.name}`);
    doc.text(`Project: ${invoice.project}`);
    doc.text(`Paid Amount: ${amountPaid}`);
    doc.text(`Total Paid: ${newPaidAmount}`);
    doc.text(`Invoice Total: ${invoice.grandTotal}`);
    doc.text(`Remaining Balance: ${invoice.grandTotal - newPaidAmount}`);

    doc.end();

    // ⏳ Wait for PDF to finish writing properly (NO setTimeout)
    stream.on("finish", async () => {
      try {
        const result = await cloudinary.uploader.upload(pdfPath, {
          resource_type: "raw",
          folder: "receipts"
        });

        const receipt = new Receipt({
          invoice: invoice._id,
          client: invoice.client._id,
          amountPaid,
          receiptNumber,
          receiptPdf: result.secure_url
        });

        const savedReceipt = await receipt.save();

        fs.unlinkSync(pdfPath);

        return res.status(201).json({
          message: "Receipt generated successfully",
          receipt: savedReceipt,
          updatedInvoice: invoice
        });

      } catch (uploadError) {
        return res.status(500).json({
          error: "PDF upload failed",
          details: uploadError.message
        });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllReceipts = async (req, res) => {
  try {

    const receipts = await Receipt.find()
      .populate("client", "name clientCode")
      .populate("invoice", "project grandTotal paidAmount paymentStatus");

    res.status(200).json({
      count: receipts.length,
      receipts
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getReceiptsByInvoiceId = async (req, res) => {
  try {

    const receipts = await Receipt.find({ invoice: req.params.invoiceId })
      .populate("client", "name clientCode")
      .populate("invoice", "project grandTotal");

    if (receipts.length === 0) {
      return res.status(404).json({
        message: "No receipts found for this invoice"
      });
    }

    res.status(200).json(receipts);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getReceiptsByClientId = async (req, res) => {
  try {

    const receipts = await Receipt.find({ client: req.params.clientId })
      .populate("client", "name clientCode")
      .populate("invoice", "project grandTotal");

    if (receipts.length === 0) {
      return res.status(404).json({
        message: "No receipts found for this client"
      });
    }

    res.status(200).json(receipts);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getReceiptById = async (req, res) => {
  try {

    const receipt = await Receipt.findById(req.params.id)
      .populate("client", "name clientCode")
      .populate("invoice", "project grandTotal paidAmount");

    if (!receipt) {
      return res.status(404).json({
        message: "Receipt not found"
      });
    }

    res.status(200).json(receipt);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (req.body.amountPaid !== undefined) {
      receipt.amountPaid = Number(req.body.amountPaid);
    }

    if (req.body.paymentDate !== undefined) {
      receipt.paymentDate = new Date(req.body.paymentDate);
    }

    const updatedReceipt = await receipt.save();

    res.status(200).json({
      message: "Receipt updated successfully",
      receipt: updatedReceipt
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.deleteReceipt = async (req, res) => {
  try {

    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        message: "Receipt not found"
      });
    }

    await receipt.deleteOne();

    res.status(200).json({
      message: "Receipt deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


