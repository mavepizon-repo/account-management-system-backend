const Voucher = require("../../models/vendor/Voucher");
const Purchase = require("../../models/vendor/Purchase");
const WorkSubcontract = require("../../models/subcontractor/WorkSubcontract");

const cloudinary = require("../../config/cloudinary");
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
      workSubcontractId,
      receiverType,
      receiver,
      purpose,
      amount,
      paymentMethod
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    let purchase = null;
    let workSubcontract = null;

    let totalAmount = 0;
    let newPaidAmount = 0;
    let outstandingAmount = 0;

    // ===============================
    // PURCHASE PAYMENT
    // ===============================
    if (purchaseId) {

      purchase = await Purchase.findById(purchaseId).populate("vendor");

      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      const remainingAmount = purchase.grandTotal - purchase.paidAmount;

      if (amount > remainingAmount) {
        return res.status(400).json({
          message: "Payment exceeds remaining balance",
          remainingAmount
        });
      }

      totalAmount = purchase.grandTotal;

      newPaidAmount = purchase.paidAmount + amount;

      outstandingAmount = totalAmount - newPaidAmount;

      purchase.paidAmount = newPaidAmount;

      if (newPaidAmount === 0) purchase.paymentStatus = "Unpaid";
      else if (newPaidAmount < purchase.grandTotal) purchase.paymentStatus = "Partial";
      else purchase.paymentStatus = "Paid";

      await purchase.save();
    }

    // ===============================
    // WORK SUBCONTRACT PAYMENT
    // ===============================
    if (workSubcontractId) {

      workSubcontract = await WorkSubcontract.findById(workSubcontractId)
        .populate("subcontract");

      if (!workSubcontract) {
        return res.status(404).json({ message: "WorkSubcontract not found" });
      }

      const remainingAmount =
        workSubcontract.totalAmount - workSubcontract.paidAmount;

      if (amount > remainingAmount) {
        return res.status(400).json({
          message: "Payment exceeds remaining balance",
          remainingAmount
        });
      }

      totalAmount = workSubcontract.totalAmount;

      newPaidAmount = workSubcontract.paidAmount + amount;

      outstandingAmount = totalAmount - newPaidAmount;

      workSubcontract.paidAmount = newPaidAmount;

      workSubcontract.balanceAmount = outstandingAmount;

      if (newPaidAmount === 0) workSubcontract.paymentStatus = "Unpaid";
      else if (newPaidAmount < totalAmount) workSubcontract.paymentStatus = "Partial";
      else workSubcontract.paymentStatus = "Paid";

      await workSubcontract.save();
    }

    // ===============================
    // GENERATE VOUCHER NUMBER
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
      doc.text(value || "-", 200, infoY);
      infoY += 20;
    };

    infoRow("Voucher Number:", voucherNumber);
    infoRow("Date:", new Date().toLocaleDateString());
    infoRow("Receiver Type:", receiverType);
    infoRow("Purpose:", purpose);
    infoRow("Payment Method:", paymentMethod);

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

    row("Total Amount", totalAmount);
    row("Amount Paid Now", amount);
    row("Total Paid Till Now", newPaidAmount);
    row("Outstanding Amount", outstandingAmount);

    doc.moveTo(50, y).lineTo(550, y).stroke();

    // ===============================
    // FOOTER
    // ===============================

    doc
      .fontSize(9)
      .text("This is a system generated voucher.", 50, y + 40, {
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
          folder: "vouchers"
        });

        const voucher = new Voucher({
          voucherNumber,
          receiverType,
          receiver,
          purchase: purchase ? purchase._id : null,
          workSubcontract: workSubcontract ? workSubcontract._id : null,
          purpose,
          amount,
          paymentMethod,
          pdfUrl: result.secure_url
        });

        const savedVoucher = await voucher.save();

        fs.unlinkSync(pdfPath);

        res.status(201).json({
          message: "Voucher created successfully",
          voucher: savedVoucher
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

// ===============================
// GET ALL VOUCHERS
// ===============================
exports.getAllVouchers = async (req, res) => {
  try {

    const vouchers = await Voucher.find()
      .populate({
        path: "purchase",
        populate: {
          path: "vendor",
          select: "vendorCode name"
        }
      })
      .populate({
        path: "workSubcontract",
        populate: {
          path: "subcontract",
          select: "name subcontractCode"
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


// ===============================
// GET VOUCHER BY ID
// ===============================
exports.getVoucherById = async (req, res) => {
  try {

    const voucher = await Voucher.findById(req.params.voucherId)
      .populate("purchase")
      .populate("workSubcontract");

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    res.status(200).json({ data: voucher });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// GET VOUCHERS BY PURCHASE ID
// ===============================
exports.getVouchersByPurchaseId = async (req, res) => {
  try {

    const vouchers = await Voucher.find({
      purchase: req.params.purchaseId
    })
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
    res.status(500).json({
      message: "Error fetching vouchers",
      error: error.message
    });
  }
};


exports.getVouchersByWorkSubcontractId = async (req, res) => {
  try {

    const vouchers = await Voucher.find({
      workSubcontract: req.params.workSubcontractId
    }).populate({
      path: "workSubcontract",
      populate: {
        path: "subcontract",
        select: "name subcontractCode"
      }
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
      receiver,
      purpose,
      amount,
      paymentMethod
    } = req.body;

    const voucher = await Voucher.findById(voucherId);

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }

    const oldAmount = voucher.amount;

    let purchase = null;
    let workSubcontract = null;

    let totalAmount = 0;
    let newPaidAmount = 0;
    let outstandingAmount = 0;

    // ===============================
    // PURCHASE UPDATE
    // ===============================
    if (voucher.purchase) {

      purchase = await Purchase.findById(voucher.purchase).populate("vendor");

      purchase.paidAmount = purchase.paidAmount - oldAmount;

      const remainingAmount = purchase.grandTotal - purchase.paidAmount;

      if (amount > remainingAmount) {
        return res.status(400).json({
          message: "Payment exceeds remaining balance",
          remainingAmount
        });
      }

      newPaidAmount = purchase.paidAmount + amount;

      purchase.paidAmount = newPaidAmount;

      totalAmount = purchase.grandTotal;

      outstandingAmount = totalAmount - newPaidAmount;

      if (newPaidAmount === 0) purchase.paymentStatus = "Unpaid";
      else if (newPaidAmount < purchase.grandTotal) purchase.paymentStatus = "Partial";
      else purchase.paymentStatus = "Paid";

      await purchase.save();
    }

    // ===============================
    // WORKSUBCONTRACT UPDATE
    // ===============================
    if (voucher.workSubcontract) {

      workSubcontract = await WorkSubcontract
        .findById(voucher.workSubcontract)
        .populate("subcontract");

      workSubcontract.paidAmount =
        workSubcontract.paidAmount - oldAmount;

      const remainingAmount =
        workSubcontract.totalAmount - workSubcontract.paidAmount;

      if (amount > remainingAmount) {
        return res.status(400).json({
          message: "Payment exceeds remaining balance",
          remainingAmount
        });
      }

      newPaidAmount = workSubcontract.paidAmount + amount;

      workSubcontract.paidAmount = newPaidAmount;

      totalAmount = workSubcontract.totalAmount;

      outstandingAmount = totalAmount - newPaidAmount;

      workSubcontract.balanceAmount = outstandingAmount;

      if (newPaidAmount === 0) workSubcontract.paymentStatus = "Unpaid";
      else if (newPaidAmount < totalAmount) workSubcontract.paymentStatus = "Partial";
      else workSubcontract.paymentStatus = "Paid";

      await workSubcontract.save();
    }

    // ===============================
    // UPDATE VOUCHER DATA FIRST
    // ===============================

    voucher.receiverType = receiverType || voucher.receiverType;
    voucher.receiver = receiver || voucher.receiver;
    voucher.purpose = purpose || voucher.purpose;
    voucher.amount = amount;
    voucher.paymentMethod = paymentMethod || voucher.paymentMethod;

    await voucher.save();

    const voucherNumber = voucher.voucherNumber;

    // ===============================
    // CREATE TEMP PDF
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
      doc.text(value || "-", 200, infoY);
      infoY += 20;
    };

    infoRow("Voucher Number:", voucherNumber);
    infoRow("Date:", new Date().toLocaleDateString());
    infoRow("Receiver Type:", voucher.receiverType);
    infoRow("Purpose:", voucher.purpose);
    infoRow("Payment Method:", voucher.paymentMethod);

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

    row("Total Amount", totalAmount);
    row("Amount Paid Now", voucher.amount);
    row("Total Paid Till Now", newPaidAmount);
    row("Outstanding Amount", outstandingAmount);

    doc.moveTo(50, y).lineTo(550, y).stroke();

    doc
      .fontSize(9)
      .text("This is a system generated voucher.", 50, y + 40, {
        align: "center",
        width: 500
      });

    doc.end();

    // ===============================
    // CLOUDINARY UPLOAD
    // ===============================

    stream.on("finish", async () => {

      const result = await cloudinary.uploader.upload(pdfPath, {
        resource_type: "raw",
        folder: "vouchers",
        public_id: voucherNumber,
        overwrite: true
      });

      voucher.pdfUrl = result.secure_url;

      await voucher.save();

      fs.unlinkSync(pdfPath);

      res.status(200).json({
        message: "Voucher updated successfully",
        voucher
      });

    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};


// ===============================
// DELETE VOUCHER
// ===============================
exports.deleteVoucher = async (req, res) => {

  try {

    const voucher = await Voucher.findById(req.params.voucherId);

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    // ===============================
    // REVERT PURCHASE PAYMENT
    // ===============================

    if (voucher.purchase) {

      const purchase = await Purchase.findById(voucher.purchase);

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

    // ===============================
    // REVERT SUBCONTRACT PAYMENT
    // ===============================

    if (voucher.workSubcontract) {

      const workSubcontract = await WorkSubcontract.findById(
        voucher.workSubcontract
      );

      workSubcontract.paidAmount -= voucher.amount;

      if (workSubcontract.paidAmount < 0) {
        workSubcontract.paidAmount = 0;
      }

      workSubcontract.balanceAmount =
        workSubcontract.totalAmount - workSubcontract.paidAmount;

      if (workSubcontract.paidAmount === 0)
        workSubcontract.paymentStatus = "Unpaid";
      else if (workSubcontract.paidAmount < workSubcontract.totalAmount)
        workSubcontract.paymentStatus = "Partial";
      else
        workSubcontract.paymentStatus = "Paid";

      await workSubcontract.save();
    }

    await Voucher.findByIdAndDelete(req.params.voucherId);

    res.status(200).json({
      message: "Voucher deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};







// {
//   "receiverType": "Vendor",
//   "receiver": "69f49aaf393abace91f61d01",
//   "purchaseId": "69f4a12d95232933d78acbb5",
//   "purpose": "Material payment",
//   "amount": 1000,
//   "paymentMethod": "cash"
// }