const cloudinary = require("../config/cloudinary");
const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const Receipt = require("../models/Receipt");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


exports.createReceipt = async (req, res) => {
  try {

    const { invoiceId, amountPaid, description } = req.body;

    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const invoice = await Invoice.findById(invoiceId).populate("client");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const remainingAmount = invoice.grandTotal - invoice.paidAmount;

    let advanceAmount = 0;
    let newPaidAmount = invoice.paidAmount;

    // ===============================
    // ADVANCE PAYMENT LOGIC
    // ===============================

    if (amountPaid > remainingAmount) {

      advanceAmount = amountPaid - remainingAmount;

      newPaidAmount = invoice.grandTotal; // invoice fully paid

    } else {

      newPaidAmount = invoice.paidAmount + amountPaid;

    }

    // ===============================
    // PAYMENT STATUS
    // ===============================

    let paymentStatus = "Unpaid";

    if (newPaidAmount > 0 && newPaidAmount < invoice.grandTotal) {
      paymentStatus = "Partial";
    }
    else if (newPaidAmount >= invoice.grandTotal) {
      paymentStatus = "Paid";
    }

    invoice.paidAmount = newPaidAmount;
    invoice.paymentStatus = paymentStatus;

    await invoice.save();

    // ===== RECEIPT NUMBER =====

    const lastReceipt = await Receipt.findOne().sort({ createdAt: -1 });

    let receiptNumber = "RC0001";

    if (lastReceipt) {
      const num = parseInt(lastReceipt.receiptNumber.substring(2)) + 1;
      receiptNumber = "RC" + String(num).padStart(4, "0");
    }

    // ===== TEMP PDF =====

    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const pdfPath = path.join(uploadDir, `${receiptNumber}.pdf`);

    const doc = new PDFDocument({ margin: 50 });

    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // ===============================
    // HEADER
    // ===============================

    const startX = 50;
    const startY = 50;

    const logoPath = path.join(__dirname, "../assets/logo.jpeg");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, startX, startY, { width: 110 });
    }

    const rightX = 180;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("DESIGN ART", rightX, startY);

    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        "5-6, Indria Nagar, PM Samy Colony, Ratinapuri, Gandhipuram, Coimbatore - 641012",
        rightX,
        doc.y,
        { width: 350 }
      );

    doc.moveDown(0.3);

    doc.text(
      "Phone: +91 9677731326 | GST: 33BNCPP2332Q1ZT",
      rightX,
      doc.y,
      { width: 350 }
    );

    const lineY = Math.max(doc.y + 10, startY + 100);

    doc.moveTo(50, lineY).lineTo(550, lineY).stroke();

    // ===============================
    // RECEIPT TITLE
    // ===============================

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("PAYMENT RECEIPT", 0, lineY + 20, { align: "center" });

    // ===============================
    // INFO BOX
    // ===============================

    const boxTop = lineY + 60;

    doc.rect(50, boxTop, 500, 120).stroke();

    doc.fontSize(11).font("Helvetica");

    let infoY = boxTop + 15;

    const infoRow = (label, value) => {
      doc.text(label, 70, infoY);
      doc.text(value, 200, infoY);
      infoY += 20;
    };

    infoRow("Receipt Number:", receiptNumber);
    infoRow("Invoice Number:", invoice.invoiceNumber || invoice._id.toString());
    infoRow("Date:", new Date().toLocaleDateString());
    infoRow("Client Name:", invoice.client.name);
    infoRow("Description:", description || "Payment received");

    // ===============================
    // TABLE
    // ===============================

    const tableTop = boxTop + 150;

    doc
      .font("Helvetica-Bold")
      .text("Description", 70, tableTop)
      .text("Amount (Rs.)", 400, tableTop, { align: "right" });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    doc.font("Helvetica");

    let y = tableTop + 35;

    const row = (label, value) => {
      doc.text(label, 70, y);
      doc.text(`Rs. ${Number(value).toFixed(2)}`, 400, y, { align: "right" });
      y += 25;
    };

    row("Invoice Total", invoice.grandTotal);
    row("Amount Paid", amountPaid);
    row("Total Paid Till Now", newPaidAmount);
    row("Remaining Balance", invoice.grandTotal - newPaidAmount);

    if (advanceAmount > 0) {
      row("Advance Amount", advanceAmount);
    }

    doc.moveTo(50, y).lineTo(550, y).stroke();

    // ===============================
    // FOOTER
    // ===============================

    doc
      .fontSize(11)
      .text("Thank you for your payment!", 50, y + 40, {
        align: "center",
        width: 500
      });

    doc
      .fontSize(9)
      .text("This is a system generated receipt.", 50, y + 60, {
        align: "center",
        width: 500
      });

    doc.end();

    // ===============================
    // CLOUDINARY UPLOAD
    // ===============================

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
          description,
          receiptNumber,
          receiptPdf: result.secure_url,
          paymentDate: new Date()
        });

        const savedReceipt = await receipt.save();

        fs.unlinkSync(pdfPath);

        res.status(201).json({
          message: "Receipt generated successfully",
          receipt: savedReceipt,
          updatedInvoice: invoice,
          advanceAmount
        });

      } catch (err) {

        res.status(500).json({
          error: "Cloudinary upload failed",
          details: err.message
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
    .populate("invoice", "project grandTotal paidAmount paymentStatus")
    .sort({ createdAt: -1 });

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


// ===== UPDATE RECEIPT =====

exports.updateReceipt = async (req, res) => {
  try {

    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const invoice = await Invoice.findById(receipt.invoice);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (req.body.amountPaid !== undefined) {

    const difference = Number(req.body.amountPaid) - receipt.amountPaid;

    invoice.paidAmount += difference;

    receipt.amountPaid = Number(req.body.amountPaid);

    // update payment status
    if (invoice.paidAmount === 0) {
      invoice.paymentStatus = "Unpaid";
    } 
    else if (invoice.paidAmount < invoice.grandTotal) {
      invoice.paymentStatus = "Partial";
    } 
    else {
      invoice.paymentStatus = "Paid";
    }

    await invoice.save();
  }

    if (req.body.paymentDate !== undefined) {
      receipt.paymentDate = new Date(req.body.paymentDate);
    }

    if (req.body.description !== undefined) {
      receipt.description = req.body.description;
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

    const invoice = await Invoice.findById(receipt.invoice);

    if (invoice) {
      invoice.paidAmount -= receipt.amountPaid;

      if (invoice.paidAmount <= 0) {
        invoice.paymentStatus = "Unpaid";
      } 
      else if (invoice.paidAmount < invoice.grandTotal) {
        invoice.paymentStatus = "Partial";
      } 
      else {
        invoice.paymentStatus = "Paid";
      }

      await invoice.save();
    }

    await receipt.deleteOne();

    res.status(200).json({
      message: "Receipt deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};