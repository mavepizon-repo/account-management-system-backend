const cloudinary = require("../../config/cloudinary");

const LabourVoucher = require("../../models/labour/LabourVoucher");
const Labour = require("../../models/labour/Labour");
const Attendance = require("../../models/labour/Attendance");
const AdvancePayment = require("../../models/labour/AdvancePayment");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


// ===============================================
// GET LABOUR VOUCHER CALCULATION
// ===============================================

exports.getLabourVoucherCalculation = async (req, res) => {
  try {

    const {
      labourId,
      fromDate,
      toDate,
      deductedAdvanceAmount = 0
    } = req.body;

    // =========================
    // VALIDATE LABOUR
    // =========================

    const labour = await Labour.findById(labourId);

    if (!labour) {
      return res.status(404).json({
        message: "Labour not found"
      });
    }

    // =========================
    // DATE RANGE
    // =========================

    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    // =========================
    // GET ATTENDANCE
    // =========================

    const attendance = await Attendance.find({
      labour: labour._id,
      salaryPaid: false,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    // =========================
    // CALCULATIONS
    // =========================

    const totalWorkingDays = attendance.length;

    const totalWorkingHours = attendance.reduce(
      (sum, item) => sum + item.totalHours,
      0
    );

    const overtimeHours = attendance.reduce(
      (sum, item) => sum + item.overtimeHours,
      0
    );

    // =========================
    // SALARY CALCULATION
    // =========================

    const perHourSalary = labour.dailyWage / 8;

    const normalHours =
      totalWorkingHours - overtimeHours;

    const normalSalary =
      normalHours * perHourSalary;

    const overtimeSalary =
      overtimeHours * perHourSalary;

    const totalSalary =
      normalSalary + overtimeSalary;

    // =========================
    // ADVANCE CALCULATION
    // =========================

    const advance = await AdvancePayment.findOne({
      labour: labour._id,
      remainingAmount: { $gt: 0 }
    });

    
    let totalAdvanceGiven = 0;
  
    let deductedAmount = 0;

    let remainingAdvanceAmount = 0;

    let advanceDetails = null;

    if (advance) {

      totalAdvanceGiven =
        advance.advanceAmount;

      // ======================================
      // MONTHLY INSTALLMENT
      // ======================================

      if (
        advance.deductionType ===
        "Monthly Installment"
      ) {

        deductedAmount =
          advance.advanceAmount /
          advance.installmentMonths;

      }

      // ======================================
      // FIXED AMOUNT
      // ======================================

      else if (
        advance.deductionType ===
        "Fixed Amount"
      ) {

        deductedAmount =
          advance.fixedDeductionAmount;

      }

      // ======================================
      // CUSTOM
      // ======================================

      else if (
        advance.deductionType ===
        "Custom"
      ) {

        deductedAmount =
          Number(deductedAdvanceAmount || 0);

      }

      deductedAmount =
        Number(
          deductedAmount.toFixed(2)
        );

      // ======================================
      // SAFETY CHECK
      // ======================================

      if (
        deductedAmount >
        advance.remainingAmount
      ) {

        deductedAmount =
          advance.remainingAmount;

      }

      remainingAdvanceAmount =
        advance.remainingAmount -
        deductedAmount;

      advanceDetails = {

        advanceId: advance._id,

        advanceAmount:
          advance.advanceAmount,

        deductionType:
          advance.deductionType,

        deductedAmount,

        remainingBefore:
          advance.remainingAmount,

        remainingAfter:
          remainingAdvanceAmount
      };
    }

    // =========================
    // FINAL PAYABLE
    // =========================

    const payableSalary =
      totalSalary - deductedAmount;

    // =========================
    // RESPONSE
    // =========================

    res.json({
      labour,
      fromDate,
      toDate,

      totalWorkingDays,

      totalWorkingHours:
        Number(totalWorkingHours.toFixed(2)),

      overtimeHours:
        Number(overtimeHours.toFixed(2)),

      totalSalary:
        Number(totalSalary.toFixed(2)),

      totalAdvanceGiven,

      deductedAdvanceAmount: deductedAmount,

      remainingAdvanceAmount,

      payableSalary:
        Number(payableSalary.toFixed(2)),

      advanceDetails,

      attendance
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// ===============================================
// CREATE LABOUR VOUCHER
// ===============================================

exports.createLabourVoucher = async (req, res) => {

  try {

    const {

      labourId,
      fromDate,
      toDate,

      // ADMIN EDITED VALUE
      deductedAmount

    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (
      !labourId ||
      !fromDate ||
      !toDate
    ) {

      return res.status(400).json({
        message:
          "labourId, fromDate and toDate required"
      });

    }

    // ==========================================
    // LABOUR
    // ==========================================

    const labour = await Labour.findById(
      labourId
    );

    if (!labour) {

      return res.status(404).json({
        message: "Labour not found"
      });

    }

    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    // ==========================================
    // DUPLICATE RANGE CHECK
    // ==========================================

    const existingLabourVoucher =
      await LabourVoucher.findOne({

        labour: labourId,

        fromDate: { $lte: end },

        toDate: { $gte: start }

      });

    if (existingLabourVoucher) {

      return res.status(400).json({
        message:
          "Labour voucher already exists for selected range"
      });

    }

    // ==========================================
    // ATTENDANCE
    // ==========================================

    const attendanceRecords =
      await Attendance.find({

        labour: labourId,

        salaryPaid: false,

        date: {
          $gte: start,
          $lte: end
        }

      }).sort({ date: 1 });

    // ==========================================
    // CALCULATIONS
    // ==========================================

    let totalWorkingDays =
      attendanceRecords.length;

    let totalWorkingHours = 0;

    let overtimeHours = 0;

    let totalSalary = 0;

    const perHour =
      labour.dailyWage / 8;

    attendanceRecords.forEach(record => {

      const hours =
        record.totalHours || 0;

      const ot =
        record.overtimeHours || 0;

      totalWorkingHours += hours;

      overtimeHours += ot;

      // overtime already included in totalHours
      totalSalary += hours * perHour;

    });

    // ==========================================
    // ROUND VALUES
    // ==========================================

    totalWorkingHours =
      Number(totalWorkingHours.toFixed(2));

    overtimeHours =
      Number(overtimeHours.toFixed(2));

    totalSalary =
      Number(totalSalary.toFixed(2));
    // ==========================================
    // SINGLE ADVANCE
    // ==========================================

    const advance =
      await AdvancePayment.findOne({

        labour: labourId,

        remainingAmount: { $gt: 0 }

      }).sort({ createdAt: 1 });

    let totalAdvanceGiven = 0;

    let deductedAdvanceAmount = 0;

    let remainingAdvanceAmount = 0;

    let advanceDetails = null;

    // ==========================================
    // ADVANCE PROCESS
    // ==========================================

    if (advance) {

      totalAdvanceGiven =
        advance.advanceAmount;

      if (
        advance.deductionType ===
        "Monthly Installment"
      ) {

        deductedAdvanceAmount =
          advance.advanceAmount /
          advance.installmentMonths;

      }

      else if (
        advance.deductionType ===
        "Fixed Amount"
      ) {

        deductedAdvanceAmount =
          advance.fixedDeductionAmount;

      }

      else if (
        advance.deductionType ===
        "Custom"
      ) {

        deductedAdvanceAmount =
          Number(deductedAmount || 0);

      }

      // ======================================
      // NEGATIVE CHECK
      // ======================================

      if (deductedAdvanceAmount < 0) {

        return res.status(400).json({
          message:
            "Deduction amount cannot be negative"
        });

      }

      // ======================================
      // SAFETY CHECK
      // ======================================

      if (
        deductedAdvanceAmount >
        advance.remainingAmount
      ) {

        return res.status(400).json({
          message:
            `Deduction amount exceeds remaining advance amount. Maximum allowed is Rs.${advance.remainingAmount}`
        });

      }

      // ======================================
      // UPDATE ADVANCE
      // ======================================

      advance.deductedAmount +=
        deductedAdvanceAmount;

      advance.remainingAmount -=
        deductedAdvanceAmount;

      // ======================================
      // STATUS
      // ======================================

      if (
        advance.remainingAmount <= 0
      ) {

        advance.remainingAmount = 0;

        advance.status = "Paid";

      }

      else if (
        advance.remainingAmount <
        advance.advanceAmount
      ) {

        advance.status = "Partial";

      }

      else {

        advance.status = "Pending";

      }

      await advance.save();

      remainingAdvanceAmount =
        advance.remainingAmount;

      advanceDetails = {

        advanceId: advance._id,

        deductionType:
          advance.deductionType,

        deductedAmount:
          Number(
            deductedAdvanceAmount.toFixed(2)
          )
      };
    }

    // ==========================================
    // FINAL VALUES
    // ==========================================

    const payableSalary =
      totalSalary -
      deductedAdvanceAmount;

    // ==========================================
    // PDF GENERATION
    // ==========================================

    const doc =
      new PDFDocument({
        margin: 50
      });

    const fileName =
      `labour-voucher-${Date.now()}.pdf`;

    const filePath = path.join(
      __dirname,
      "../../uploads",
      fileName
    );

    const stream =
      fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ==========================================
    // HEADER
    // ==========================================

    const startX = 50;
    const startY = 50;

    const logoPath = path.join(
      __dirname,
      "../../assets/logo.jpeg"
    );

    if (fs.existsSync(logoPath)) {

      doc.image(
        logoPath,
        startX,
        startY,
        { width: 110 }
      );
    }

    const rightX = 180;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(
        "DESIGN ART",
        rightX,
        startY
      );

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

    const lineY =
      Math.max(
        doc.y + 10,
        startY + 100
      );

    doc
      .moveTo(50, lineY)
      .lineTo(550, lineY)
      .stroke();

    // ==========================================
    // TITLE
    // ==========================================

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(
        "LABOUR SALARY VOUCHER",
        0,
        lineY + 20,
        { align: "center" }
      );

    // ==========================================
    // INFO BOX
    // ==========================================

    const boxTop = lineY + 60;

    doc
      .rect(50, boxTop, 500, 140)
      .stroke();

    doc
      .fontSize(11)
      .font("Helvetica");

    let infoY = boxTop + 15;

    const infoRow = (label, value) => {

      doc.text(label, 70, infoY);

      doc.text(
        value || "-",
        220,
        infoY
      );

      infoY += 20;
    };

    infoRow(
      "Labour Name:",
      labour.name
    );

    infoRow(
      "Phone:",
      labour.phone || "-"
    );

    infoRow(
      "Work Type:",
      labour.workType || "-"
    );

    infoRow(
      "From Date:",
      fromDate
    );

    infoRow(
      "To Date:",
      toDate
    );

    infoRow(
      "Generated Date:",
      new Date().toLocaleDateString()
    );

    // ==========================================
    // TABLE
    // ==========================================

    const tableTop =
      boxTop + 170;

    doc
      .font("Helvetica-Bold")
      .text(
        "Description",
        70,
        tableTop
      )
      .text(
        "Value",
        400,
        tableTop,
        { align: "right" }
      );

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font("Helvetica");

    let y = tableTop + 35;

    const row = (label, value) => {

      doc.text(label, 70, y);

      doc.text(
        String(value),
        400,
        y,
        { align: "right" }
      );

      y += 25;
    };

    row(
      "Total Working Days",
      totalWorkingDays
    );

    row(
      "Total Working Hours",
      totalWorkingHours.toFixed(2)
    );

    row(
      "Overtime Hours",
      overtimeHours.toFixed(2)
    );

    row(
      "Total Salary",
      `Rs. ${totalSalary.toFixed(2)}`
    );

    row(
      "Total Advance Given",
      `Rs. ${totalAdvanceGiven.toFixed(2)}`
    );

    row(
      "Advance Deduction",
      `Rs. ${deductedAdvanceAmount.toFixed(2)}`
    );

    row(
      "Remaining Advance",
      `Rs. ${remainingAdvanceAmount.toFixed(2)}`
    );

    doc
      .font("Helvetica-Bold");

    row(
      "Payable Salary",
      `Rs. ${payableSalary.toFixed(2)}`
    );

    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();

    // ==========================================
    // ADVANCE DETAILS
    // ==========================================

    if (advanceDetails) {

      y += 30;

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(
          "Advance Details",
          50,
          y
        );

      y += 25;

      doc
        .font("Helvetica")
        .fontSize(11);

      doc.text(
        `Deduction Type : ${advanceDetails.deductionType}`,
        70,
        y
      );

      y += 20;

      doc.text(
        `Deducted Amount : Rs.${advanceDetails.deductedAmount}`,
        70,
        y
      );
    }

    // ==========================================
    // FOOTER
    // ==========================================

    doc
      .fontSize(11)
      .text(
        "This is a system generated labour voucher.",
        50,
        730,
        {
          align: "center",
          width: 500
        }
      );

    doc.end();

    await new Promise(resolve =>
      stream.on("finish", resolve)
    );

    // ==========================================
    // CLOUDINARY UPLOAD
    // ==========================================

    const upload =
      await cloudinary.uploader.upload(
        filePath,
        {
          resource_type: "raw",
          folder: "labour_vouchers"
        }
      );

    // ==========================================
    // SAVE LABOUR VOUCHER
    // ==========================================

    const labourVoucher =
      new LabourVoucher({

        labour: labourId,

        fromDate,
        toDate,

        month:
          new Date(fromDate).getMonth() + 1,

        year:
          new Date(fromDate).getFullYear(),

        totalWorkingDays,

        totalWorkingHours:
          Number(
            totalWorkingHours.toFixed(2)
          ),

        overtimeHours:
          Number(
            overtimeHours.toFixed(2)
          ),

        totalSalary:
          Number(
            totalSalary.toFixed(2)
          ),

        totalAdvanceGiven:
          Number(
            totalAdvanceGiven.toFixed(2)
          ),

        deductedAdvanceAmount:
          Number(
            deductedAdvanceAmount.toFixed(2)
          ),

        remainingAdvanceAmount:
          Number(
            remainingAdvanceAmount.toFixed(2)
          ),

        payableSalary:
          Number(
            payableSalary.toFixed(2)
          ),

        voucherPdf: {
          url: upload.secure_url,
          public_id:
            upload.public_id
        }
      });

    await labourVoucher.save();

    await Attendance.updateMany(
    {
      _id: {
        $in: attendanceRecords.map(
          a => a._id
        )
      }
    },
    {
      salaryPaid: true
    }
  );

    // ==========================================
    // DELETE LOCAL FILE
    // ==========================================

    fs.unlinkSync(filePath);

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(201).json({

      message:
        "Labour voucher created successfully",

      data: labourVoucher
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



exports.getAllVouchers = async (req, res) => {
  try {

    const vouchers =
      await LabourVoucher.find()
        .populate(
          "labour",
          "labourId name phone workType"
        )
        .sort({ createdAt: -1 });

    res.json({
      count: vouchers.length,
      data: vouchers
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


exports.getVoucherById = async (req, res) => {
  try {

    const voucher =
      await LabourVoucher.findById(
        req.params.id
      ).populate(
        "labour",
        "labourId name phone workType"
      );

    if (!voucher) {

      return res.status(404).json({
        message: "Voucher not found"
      });

    }

    res.json(voucher);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


exports.getVouchersByLabourId = async (req, res) => {
  try {

    const labour =
      await Labour.findById(
        req.params.labourId
      );

    if (!labour) {

      return res.status(404).json({
        message: "Labour not found"
      });

    }

    const vouchers =
      await LabourVoucher.find({
        labour: labour._id
      })
        .populate(
          "labour",
          "labourId name phone"
        )
        .sort({ fromDate: -1 });

    res.json({
      count: vouchers.length,
      data: vouchers
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


exports.deleteVoucher = async (req, res) => {
  try {

    const voucher =
      await LabourVoucher.findById(
        req.params.id
      );

    if (!voucher) {

      return res.status(404).json({
        message: "Voucher not found"
      });

    }

    // ====================================
    // DELETE PDF FROM CLOUDINARY
    // ====================================

    if (
      voucher.voucherPdf &&
      voucher.voucherPdf.public_id
    ) {

      await cloudinary.uploader.destroy(
        voucher.voucherPdf.public_id,
        {
          resource_type: "raw"
        }
      );

    }

    // ====================================
    // RESTORE ADVANCE
    // ====================================

    const advance =
      await AdvancePayment.findOne({
        labour: voucher.labour
      });

    if (advance) {

      advance.deductedAmount -=
        voucher.deductedAdvanceAmount;

      advance.remainingAmount +=
        voucher.deductedAdvanceAmount;

      // SAFETY
      if (advance.deductedAmount < 0) {

        advance.deductedAmount = 0;

      }

      // SAFETY
      if (
        advance.remainingAmount >
        advance.advanceAmount
      ) {

        advance.remainingAmount =
          advance.advanceAmount;

      }

      // ====================================
      // STATUS
      // ====================================

      if (advance.remainingAmount === 0) {

        advance.status = "Paid";

      }

      else if (
        advance.remainingAmount <
        advance.advanceAmount
      ) {

        advance.status = "Partial";

      }

      else {

        advance.status = "Pending";

      }

      await advance.save();
    }

    // ====================================
    // RESTORE ATTENDANCE
    // ====================================

    await Attendance.updateMany(
      {
        labour: voucher.labour,

        date: {
          $gte: voucher.fromDate,
          $lte: voucher.toDate
        }
      },
      {
        salaryPaid: false
      }
    );

    // ====================================
    // DELETE VOUCHER
    // ====================================

    await LabourVoucher.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Voucher deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

