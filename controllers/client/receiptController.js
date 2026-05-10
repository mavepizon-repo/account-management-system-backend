const cloudinary = require("../../config/cloudinary");
const Invoice = require("../../models/client/Invoice");
const Client = require("../../models/client/Client");
const Receipt = require("../../models/client/Receipt");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


exports.createReceipt = async (req, res) => {
  try {

    const { invoiceId, clientId, paidAmountInReceipt, description } = req.body;

    if (!paidAmountInReceipt || paidAmountInReceipt <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    let invoice = null;
    let client = null;

    // ===============================
    // CASE 1 : RECEIPT WITH INVOICE
    // ===============================

    if (invoiceId) {

      invoice = await Invoice.findById(invoiceId).populate("client");

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      client = invoice.client;

    }

    // ===============================
    // CASE 2 : ADVANCE RECEIPT
    // ===============================

    else if (clientId) {

      client = await Client.findById(clientId);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

    } else {

      return res.status(400).json({
        message: "Either invoiceId or clientId is required"
      });

    }

    let advanceAmount = 0;
    let newcumulativePaidAmount = 0;

    // ===============================
    // INVOICE PAYMENT LOGIC
    // ===============================

    if (invoice) {

      // cumulativePaidAmount means already paid amount till noe for this invoice
      const remainingAmount = invoice.grandTotal - invoice.cumulativePaidAmount;
      // newly paid amount is 'paidAmountInReceipt'
      if (paidAmountInReceipt > remainingAmount) {

        advanceAmount = paidAmountInReceipt - remainingAmount;
        newcumulativePaidAmount = invoice.grandTotal;

      } else {

        newcumulativePaidAmount = invoice.cumulativePaidAmount + paidAmountInReceipt;

      }

      let paymentStatus = "Unpaid";

      if (newcumulativePaidAmount > 0 && newcumulativePaidAmount < invoice.grandTotal) {
        paymentStatus = "Partial";
      }
      else if (newcumulativePaidAmount >= invoice.grandTotal) {
        paymentStatus = "Paid";
      }

      invoice.cumulativePaidAmount = newcumulativePaidAmount;
      invoice.paymentStatus = paymentStatus;

      await invoice.save();

    }

    // ===============================
    // RECEIPT NUMBER
    // ===============================

    const lastReceipt = await Receipt.findOne().sort({ createdAt: -1 });

    let receiptNumber = "RC0001";

    if (lastReceipt) {
      const num = parseInt(lastReceipt.receiptNumber.substring(2)) + 1;
      receiptNumber = "RC" + String(num).padStart(4, "0");
    }

    // ===============================
    // TEMP PDF PATH
    // ===============================

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

    const logoPath = path.join(__dirname, "../../assets/logo.jpeg");

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
      doc.text(value || "-", 200, infoY);
      infoY += 20;
    };

    infoRow("Receipt Number:", receiptNumber);

    infoRow(
      "Invoice Number:",
      invoice ? (invoice.invoiceNumber || invoice._id.toString()) : "Advance Payment"
    );

    infoRow("Date:", new Date().toLocaleDateString());

    infoRow("Client Name:", client.name);

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

    if (invoice) {

      row("Invoice Total", invoice.grandTotal);
      row("Amount Paid", paidAmountInReceipt);
      row("Total Paid Till Now", newcumulativePaidAmount);
      row("Remaining Balance", invoice.grandTotal - newcumulativePaidAmount);

      if (advanceAmount > 0) {
        row("Advance Amount", advanceAmount);
      }

    } else {

      row("Advance Payment", paidAmountInReceipt);

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
          invoice: invoice ? invoice._id : null,
          client: client._id,
          paidAmountInReceipt,
          remainingAmount: invoice ? 0 : paidAmountInReceipt,
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
          invoice: invoice || null,
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
    .populate("invoice", "invoiceNumber grandTotal cumulativePaidAmount paymentStatus")
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
      .populate("invoice", "project grandTotal cumulativePaidAmount");

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

   const receipt = await Receipt.findById(req.params.id)
  .populate("client")
  .populate("invoice");

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const invoice = receipt.invoice;

    // ===============================
    // UPDATE AMOUNT
    // ===============================

    if (req.body.paidAmountInReceipt !== undefined) {

      const newAmount = Number(req.body.paidAmountInReceipt);

      if (newAmount <= 0) {
        return res.status(400).json({
          message: "Amount must be greater than 0"
        });
      }

      // Update receipt amount first
      receipt.paidAmountInReceipt = newAmount;

      if (!invoice) {
        receipt.remainingAmount = newAmount;
      }
      await receipt.save();

      // If receipt is linked to invoice
      if (invoice) {

        // Recalculate total paid from all receipts
        const receipts = await Receipt.find({ invoice: invoice._id });

        invoice.cumulativePaidAmount = receipts.reduce(
          (sum, r) => sum + r.paidAmountInReceipt,
          0
        );

        // Payment status update
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
      }
    }

    // ===============================
    // UPDATE OTHER FIELDS
    // ===============================

    if (req.body.paymentDate !== undefined) {
      receipt.paymentDate = new Date(req.body.paymentDate);
    }

    if (req.body.description !== undefined) {
      receipt.description = req.body.description;
    }

    await receipt.save();

    // ===============================
    // PDF GENERATION (ONLY IF INVOICE)
    // ===============================

    const receiptNumber = receipt.receiptNumber;

    const uploadDir = path.join(__dirname, "../../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const pdfPath = path.join(uploadDir, `${receiptNumber}.pdf`);

    const doc = new PDFDocument({ margin: 50 });

    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // HEADER

    const startX = 50;
    const startY = 50;

    const logoPath = path.join(__dirname, "../../assets/logo.jpeg");

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

    // TITLE

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("PAYMENT RECEIPT", 0, lineY + 20, { align: "center" });

    // INFO BOX

    const boxTop = lineY + 60;

    doc.rect(50, boxTop, 500, 120).stroke();

    doc.fontSize(11).font("Helvetica");

    let infoY = boxTop + 15;

    const infoRow = (label, value) => {
      doc.text(label, 70, infoY);
      doc.text(value || "-", 200, infoY);
      infoY += 20;
    };

    infoRow("Receipt Number:", receiptNumber);
    infoRow(
      "Invoice Number:",
      invoice ? (invoice.invoiceNumber || invoice._id.toString()) : "Advance Payment"
    );
    infoRow("Date:", new Date(receipt.paymentDate).toLocaleDateString());
    infoRow("Client Name:", receipt.client?.name || "No Client");
    infoRow("Description:", receipt.description || "Payment received");

    // TABLE

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

    if (invoice) {

      row("Invoice Total", invoice.grandTotal);

      row("Amount Paid", receipt.paidAmountInReceipt);

      row(
        "Total Paid Till Now",
        invoice.cumulativePaidAmount
      );

      row(
        "Remaining Balance",
        Math.max(
          invoice.grandTotal - invoice.cumulativePaidAmount,
          0
        )
);
    }
    else{
      row("Advance Payment", receipt.paidAmountInReceipt);
    }
    doc.moveTo(50, y).lineTo(550, y).stroke();

    // FOOTER

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
    // CLOUDINARY
    // ===============================

    stream.on("finish", async () => {

      try {

        const result = await cloudinary.uploader.upload(pdfPath, {
          resource_type: "raw",
          folder: "receipts",
          public_id: receiptNumber,
          overwrite: true
        });

        receipt.receiptPdf = result.secure_url;

        await receipt.save();

        fs.unlinkSync(pdfPath);

        res.status(200).json({
          message: "Receipt updated successfully",
          receipt,
          invoice
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


exports.deleteReceipt = async (req, res) => {
  try {

    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        message: "Receipt not found"
      });
    }

    const invoice = await Invoice.findById(receipt.invoice);

    // Delete receipt first
    await receipt.deleteOne();

    if (invoice) {

      // Recalculate total paid from remaining receipts
      const receipts = await Receipt.find({ invoice: invoice._id });

      invoice.cumulativePaidAmount = receipts.reduce(
        (sum, r) => sum + r.paidAmountInReceipt,
        0
      );

      // Update payment status
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
    }

    res.status(200).json({
      message: "Receipt deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};