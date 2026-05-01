const Voucher = require("../models/Voucher");
const Purchase = require("../models/Purchase");

const cloudinary = require("../config/cloudinary");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


// ===============================
// CREATE VOUCHER
// ===============================
exports.createVoucher = async (req, res) => {

  try {

    const {
      purchaseId,
      receiverType,
      receiverName,
      purpose,
      amount,
      paymentMethod
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }

    const purchase = await Purchase.findById(purchaseId).populate("vendor");

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found"
      });
    }

    const remainingAmount = purchase.grandTotal - purchase.paidAmount;

    if (amount > remainingAmount) {
      return res.status(400).json({
        message: "Payment exceeds remaining balance",
        remainingAmount
      });
    }

    // ===============================
    // UPDATE PURCHASE
    // ===============================

    const newPaidAmount = purchase.paidAmount + amount;

    let paymentStatus = "Unpaid";

    if (newPaidAmount > 0 && newPaidAmount < purchase.grandTotal) {
      paymentStatus = "Partial";
    }
    else if (newPaidAmount === purchase.grandTotal) {
      paymentStatus = "Paid";
    }

    purchase.paidAmount = newPaidAmount;
    purchase.paymentStatus = paymentStatus;

    await purchase.save();

    // ===============================
    // VOUCHER NUMBER
    // ===============================

    const lastVoucher = await Voucher.findOne().sort({ createdAt: -1 });

    let voucherNumber = "VCH0001";

    if (lastVoucher) {
      const num = parseInt(lastVoucher.voucherNumber.substring(3)) + 1;
      voucherNumber = "VCH" + String(num).padStart(4, "0");
    }

    // ===============================
    // TEMP PDF
    // ===============================

    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const pdfPath = path.join(uploadDir, `${voucherNumber}.pdf`);

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
    // TITLE
    // ===============================

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("PAYMENT VOUCHER", 0, lineY + 20, { align: "center" });

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

    infoRow("Voucher Number:", voucherNumber);
    infoRow("Date:", new Date().toLocaleDateString());
    infoRow("Receiver:", receiverName);
    infoRow("Receiver Type:", receiverType);
    infoRow("Purpose:", purpose);

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

    row("Purchase Total", purchase.grandTotal);
    row("Voucher Amount", amount);
    row("Total Paid Till Now", newPaidAmount);
    row("Remaining Balance", purchase.grandTotal - newPaidAmount);

    doc.moveTo(50, y).lineTo(550, y).stroke();

    // ===============================
    // FOOTER
    // ===============================

    doc
      .fontSize(11)
      .text("Authorized Signature", 400, y + 60);

    doc.end();

    // ===============================
    // CLOUDINARY UPLOAD
    // ===============================

    stream.on("finish", async () => {

      try {

        const result = await cloudinary.uploader.upload(pdfPath, {
          resource_type: "raw",
          folder: "vouchers"
        });

        const voucher = new Voucher({
          voucherNumber,
          purchase: purchase._id,
          receiverType,
          receiverName,
          purpose,
          amount,
          paymentMethod,
          pdfUrl: result.secure_url
        });

        const savedVoucher = await voucher.save();

        fs.unlinkSync(pdfPath);

        res.status(201).json({
          message: "Voucher created successfully",
          voucher: savedVoucher,
          updatedPurchase: purchase
        });

      } catch (err) {

        res.status(500).json({
          error: "Cloudinary upload failed",
          details: err.message
        });

      }

    });

  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }

};


// GET ALL VOUCHERS
exports.getAllVouchers = async (req, res) => {
  try {

    const vouchers = await Voucher.find()
      .populate({
        path: "purchase",
        populate: {
          path: "vendor",
          select: "vendorCode name"
        }
      });

    res.status(200).json({
      count: vouchers.length,
      data: vouchers
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// GET VOUCHER BY ID
exports.getVoucherById = async (req, res) => {
  try {

    const voucher = await Voucher.findById(req.params.voucherId)
      .populate({
        path: "purchase",
        populate: {
          path: "vendor",
          select: "vendorCode name"
        }
      });

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    res.status(200).json({
      data: voucher
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// GET VOUCHERS BY PURCHASE ID
exports.getVouchersByPurchaseId = async (req, res) => {
  try {

    const vouchers = await Voucher.find({
      purchase: req.params.purchaseId
    });

    res.status(200).json({
      count: vouchers.length,
      data: vouchers
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching vouchers",
      error: error.message
    });
  }
};


// ===============================
// UPDATE VOUCHER
// ===============================
exports.updateVoucher = async (req, res) => {
  try {

    const { voucherId } = req.params;

    const {
      receiverType,
      receiverName,
      purpose,
      amount,
      paymentMethod
    } = req.body;

    const voucher = await Voucher.findById(voucherId);

    if (!voucher) {
      return res.status(404).json({
        message: "Voucher not found"
      });
    }

    const purchase = await Purchase.findById(voucher.purchase);

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found"
      });
    }

    const oldAmount = voucher.amount;

    // ===============================
    // UPDATE PURCHASE PAID AMOUNT
    // ===============================

    purchase.paidAmount = purchase.paidAmount - oldAmount + amount;

    if (purchase.paidAmount <= 0) {
      purchase.paidAmount = 0;
      purchase.paymentStatus = "Unpaid";
    }
    else if (purchase.paidAmount < purchase.grandTotal) {
      purchase.paymentStatus = "Partial";
    }
    else {
      purchase.paymentStatus = "Paid";
    }

    await purchase.save();

    // ===============================
    // UPDATE VOUCHER
    // ===============================

    voucher.receiverType = receiverType || voucher.receiverType;
    voucher.receiverName = receiverName || voucher.receiverName;
    voucher.purpose = purpose || voucher.purpose;
    voucher.amount = amount || voucher.amount;
    voucher.paymentMethod = paymentMethod || voucher.paymentMethod;

    const updatedVoucher = await voucher.save();

    res.status(200).json({
      message: "Voucher updated successfully",
      voucher: updatedVoucher,
      updatedPurchase: purchase
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating voucher",
      error: error.message
    });
  }
};


// DELETE VOUCHER
exports.deleteVoucher = async (req, res) => {
  try {

    const voucher = await Voucher.findById(req.params.voucherId);

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const purchase = await Purchase.findById(voucher.purchase);

    // SUBTRACT AMOUNT FROM PURCHASE
    if (purchase) {

      purchase.paidAmount -= voucher.amount;

      if (purchase.paidAmount <= 0) {
        purchase.paidAmount = 0;
        purchase.paymentStatus = "Unpaid";
      }
      else if (purchase.paidAmount < purchase.grandTotal) {
        purchase.paymentStatus = "Partial";
      }
      else {
        purchase.paymentStatus = "Paid";
      }

      await purchase.save();
    }

    await Voucher.findByIdAndDelete(req.params.voucherId);

    res.status(200).json({
      message: "Voucher Deleted Successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};