const cloudinary = require("../../config/cloudinary");

const LabourVoucher = require("../../models/labour/LabourVoucher");
const Labour = require("../../models/labour/Labour");
const Attendance = require("../../models/labour/Attendance");
const AdvancePayment = require("../../models/labour/AdvancePayment");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


// ============================
// CREATE VOUCHER
// ============================

exports.createVoucher = async (req, res) => {
  try {

    const { labourId, month, year } = req.body;

    const labour = await Labour.findById(labourId);

    if (!labour) {
      return res.status(404).json({ message: "Labour not found" });
    }

    const existingVoucher = await LabourVoucher.findOne({
      labour: labourId,
      month,
      year
    });

    if (existingVoucher) {
      return res.status(400).json({
        message: "Voucher already created for this month"
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // ========================
    // GET ATTENDANCE
    // ========================

    const attendanceRecords = await Attendance.find({
      labour: labourId,
      date: { $gte: startDate, $lt: endDate }
    });

    let totalWorkingDays = attendanceRecords.length;
    let totalWorkingHours = 0;
    let overtimeHours = 0;
    let totalSalary = 0;

    const perHour = labour.dailyWage / 8;

    attendanceRecords.forEach(record => {

      const hours = record.totalHours || 0;
      const ot = record.overtimeHours || 0;

      totalWorkingHours += hours;
      overtimeHours += ot;

      totalSalary += (hours * perHour) + (ot * perHour);

    });

    // ========================
    // GET ADVANCE
    // ========================

    const advances = await AdvancePayment.find({
      labour: labourId,
      date: { $gte: startDate, $lt: endDate }
    });

    let totalAdvance = 0;

    advances.forEach(a => {
      totalAdvance += a.advanceAmount || 0;
    });

    const payableSalary = totalSalary - totalAdvance;

    // ========================
    // PDF FILE
    // ========================

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    const doc = new PDFDocument({ margin: 50 });

    const fileName = `voucher-${labourId}-${month}-${year}.pdf`;
    const filePath = path.join(__dirname, "../../uploads", fileName);

    const stream = fs.createWriteStream(filePath);

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
    // TITLE
    // ===============================

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("LABOUR SALARY VOUCHER", 0, lineY + 20, { align: "center" });

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

    infoRow("Labour Name:", labour.name);
    infoRow("Phone:", labour.phone);
    infoRow("Work Type:", labour.workType);
    infoRow("Month:", `${monthNames[month - 1]} ${year}`);
    infoRow("Daily Wage:", `Rs. ${labour.dailyWage}`);

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

      // Fixed position for Rs.
      doc.text("Rs.", 400, y);

      // Amount aligned right
      doc.text(Number(value).toFixed(2), 430, y, { width: 120, align: "right" });

      y += 25;
    };
    
    row("Total Working Days", totalWorkingDays);
    row("Total Working Hours", totalWorkingHours);
    row("Overtime Hours", overtimeHours);
    row("Total Salary", totalSalary);
    row("Advance Paid", totalAdvance);
    row("Payable Salary", payableSalary);

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

    await new Promise(resolve => stream.on("finish", resolve));

    // ========================
    // CLOUDINARY UPLOAD
    // ========================

    const upload = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      folder: "labour_vouchers"
    });

    const voucher = new LabourVoucher({
      labour: labourId,
      month,
      year,
      totalWorkingDays,
      totalWorkingHours,
      overtimeHours,
      totalSalary,
      totalAdvance,
      payableSalary,
      voucherPdf: {
        url: upload.secure_url,
        public_id: upload.public_id
      }
    });

    await voucher.save();

    fs.unlinkSync(filePath);

    res.status(201).json({
      message: "Voucher created successfully",
      data: voucher
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ============================
// GET ALL VOUCHERS
// ============================

exports.getAllVouchers = async (req, res) => {
  try {

    let vouchers = await LabourVoucher.find()
      .populate("labour", "name phone")
      .lean();

    vouchers = vouchers.map(v => ({
      ...v,
      totalWorkingDays: v.totalWorkingDays ?? 0,
      totalWorkingHours: v.totalWorkingHours ?? 0,
      overtimeHours: v.overtimeHours ?? 0
    }));

    res.status(200).json(vouchers);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================
// GET VOUCHER BY ID
// ============================

exports.getVoucherById = async (req, res) => {
  try {

    let voucher = await LabourVoucher.findById(req.params.id)
      .populate("labour", "name phone dailyWage")
      .lean(); // important

    if (!voucher) {
      return res.status(404).json({
        message: "Voucher not found"
      });
    }

    // ✅ Ensure missing fields are added
    voucher.totalWorkingDays = voucher.totalWorkingDays ?? 0;
    voucher.totalWorkingHours = voucher.totalWorkingHours ?? 0;
    voucher.overtimeHours = voucher.overtimeHours ?? 0;

    res.status(200).json(voucher);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ============================
// UPDATE VOUCHER
// ============================

exports.updateVoucher = async (req, res) => {
  try {
    const voucherId = req.params.id;

    const voucher = await LabourVoucher.findById(voucherId).populate("labour");

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const labour = voucher.labour;

    const {
      totalWorkingDays,
      totalWorkingHours,
      overtimeHours,
      totalSalary,
      totalAdvance,
      payableSalary
    } = req.body;

    // =========================
    // UPDATE VALUES
    // =========================
    voucher.totalWorkingDays = totalWorkingDays ?? voucher.totalWorkingDays;
    voucher.totalWorkingHours = totalWorkingHours ?? voucher.totalWorkingHours;
    voucher.overtimeHours = overtimeHours ?? voucher.overtimeHours;
    voucher.totalSalary = totalSalary ?? voucher.totalSalary;
    voucher.totalAdvance = totalAdvance ?? voucher.totalAdvance;
    voucher.payableSalary = payableSalary ?? voucher.payableSalary;

    // =========================
    // GENERATE PDF
    // =========================
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    const doc = new PDFDocument({ margin: 50 });

    const fileName = `voucher-${voucherId}.pdf`;
    const filePath = path.join(__dirname, "../../uploads", fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // -------------------------
    // HEADER (LOGO + COMPANY)
    // -------------------------
    const startX = 50;
    const startY = 50;

    const logoPath = path.join(__dirname, "../../assets/logo.jpeg");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, startX, startY, { width: 110 });
    }

    const rightX = 180;

    doc.font("Helvetica-Bold").fontSize(16).text("DESIGN ART", rightX, startY);

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10).text(
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

    // -------------------------
    // TITLE
    // -------------------------
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("LABOUR SALARY VOUCHER", 0, lineY + 20, { align: "center" });

    // -------------------------
    // INFO BOX
    // -------------------------
    const boxTop = lineY + 60;

    doc.rect(50, boxTop, 500, 120).stroke();

    let infoY = boxTop + 15;

    const infoRow = (label, value) => {
      doc.fontSize(11).font("Helvetica");
      doc.text(label, 70, infoY);
      doc.text(value, 200, infoY);
      infoY += 20;
    };

    infoRow("Labour Name:", labour.name);
    infoRow("Phone:", labour.phone);
    infoRow("Work Type:", labour.workType);
    infoRow("Month:", `${monthNames[voucher.month - 1]} ${voucher.year}`);
    infoRow("Daily Wage:", `Rs. ${labour.dailyWage}`);

    // -------------------------
    // TABLE
    // -------------------------
    const tableTop = boxTop + 150;

    doc.font("Helvetica-Bold")
      .text("Description", 70, tableTop)
      .text("Amount (Rs.)", 400, tableTop, { align: "right" });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 35;

    const row = (label, value) => {
      doc.font("Helvetica");
      doc.text(label, 70, y);
      doc.text("Rs.", 400, y);
      doc.text(Number(value || 0).toFixed(2), 430, y, {
        width: 120,
        align: "right"
      });
      y += 25;
    };

    row("Total Working Days", voucher.totalWorkingDays);
    row("Total Working Hours", voucher.totalWorkingHours);
    row("Overtime Hours", voucher.overtimeHours);
    row("Total Salary", voucher.totalSalary);
    row("Advance Paid", voucher.totalAdvance);

    doc.font("Helvetica-Bold");
    row("Payable Salary", voucher.payableSalary);
    doc.font("Helvetica");

    doc.moveTo(50, y).lineTo(550, y).stroke();

    doc.fontSize(9).text(
      "This is a system generated voucher.",
      50,
      y + 40,
      { align: "center", width: 500 }
    );

    doc.end();

    await new Promise(resolve => stream.on("finish", resolve));

    // =========================
    // DELETE OLD PDF (IMPORTANT FIX)
    // =========================
    if (voucher.voucherPdf?.public_id) {
      await cloudinary.uploader.destroy(voucher.voucherPdf.public_id, {
        resource_type: "raw"
      });
    }

    // =========================
    // UPLOAD NEW PDF
    // =========================
    const upload = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      folder: "labour_vouchers"
    });

    // =========================
    // SAVE NEW DATA
    // =========================
    voucher.voucherPdf = {
      url: upload.secure_url,
      public_id: upload.public_id
    };

    await voucher.save();

    // =========================
    // CLEAN LOCAL FILE
    // =========================
    fs.unlinkSync(filePath);

    return res.status(200).json({
      message: "Voucher updated successfully",
      data: voucher
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


// ============================
// DELETE VOUCHER
// ============================

exports.deleteVoucher = async (req, res) => {
  try {

    const voucher = await LabourVoucher.findByIdAndDelete(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        message: "Voucher not found"
      });
    }

    res.status(200).json({
      message: "Voucher deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ============================
// GET VOUCHERS BY LABOUR ID
// ============================

exports.getVouchersByLabourId = async (req, res) => {
  try {

    const labour = await Labour.findById(req.params.labourId);

    if (!labour) {
      return res.status(404).json({
        message: "Labour not found"
      });
    }

    const vouchers = await LabourVoucher.find({
      labour: labour._id
    }).sort({ year: -1, month: -1 });

    res.status(200).json(vouchers);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};