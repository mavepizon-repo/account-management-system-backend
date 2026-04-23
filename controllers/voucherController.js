// const cloudinary = require("../config/cloudinary");
// const Voucher = require("../models/Voucher");
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");


// // ===== CREATE VOUCHER =====

// exports.createVoucher = async (req, res) => {

//   try {

//     const {
//       receiverType,
//       receiverName,
//       purpose,
//       amount,
//       paymentMethod,
//       date
//     } = req.body;

//     if (!receiverType || !receiverName || !purpose || !amount) {
//       return res.status(400).json({
//         message: "receiverType, receiverName, purpose and amount are required"
//       });
//     }

//     // ===== GENERATE VOUCHER NUMBER =====

//     const lastVoucher = await Voucher.findOne().sort({ createdAt: -1 });

//     let voucherNumber = "VO001";

//     if (lastVoucher && lastVoucher.voucherNumber) {

//       const num = parseInt(lastVoucher.voucherNumber.substring(2)) + 1;
//       voucherNumber = "VO" + String(num).padStart(3, "0");

//     }

//     // ===== PDF GENERATION =====

//     const pdfPath = path.join(__dirname, `../${voucherNumber}.pdf`);

//     const doc = new PDFDocument({ margin: 50 });
//     const stream = fs.createWriteStream(pdfPath);

//     doc.pipe(stream);

//     // ===== HEADER =====

//     doc
//       .fontSize(20)
//       .font("Helvetica-Bold")
//       .text("DESIGN ART", { align: "center" });

//     doc
//       .fontSize(12)
//       .font("Helvetica")
//       .text("(Interior and Exterior Solution)", { align: "center" });

//     doc
//       .fontSize(10)
//       .text("Accounts Master Ledger", { align: "center" });

//     doc.moveDown();
//     doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
//     doc.moveDown(2);

//     // ===== TITLE =====

//     doc
//       .fontSize(18)
//       .font("Helvetica-Bold")
//       .text("PAYMENT VOUCHER", { align: "center" });

//     doc.moveDown(2);

//     doc.fontSize(11).font("Helvetica");

//     const labelX = 50;
//     const valueX = 200;

//     doc.text("Voucher Number :", labelX, doc.y);
//     doc.text(voucherNumber, valueX, doc.y - 14);

//     doc.moveDown();

//     doc.text("Date :", labelX, doc.y);
//     doc.text(
//       date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString(),
//       valueX,
//       doc.y - 14
//     );

//     doc.moveDown();

//     doc.text("Receiver Type :", labelX, doc.y);
//     doc.text(receiverType, valueX, doc.y - 14);

//     doc.moveDown();

//     doc.text("Paid To :", labelX, doc.y);
//     doc.text(receiverName, valueX, doc.y - 14);

//     doc.moveDown();

//     doc.text("Purpose :", labelX, doc.y);
//     doc.text(purpose, valueX, doc.y - 14);

//     doc.moveDown();

//     doc.text("Payment Method :", labelX, doc.y);
//     doc.text(paymentMethod || "cash", valueX, doc.y - 14);

//     doc.moveDown(2);

//     // ===== TABLE =====

//     const tableTop = doc.y;

//     doc
//       .font("Helvetica-Bold")
//       .text("Description", 50, tableTop)
//       .text("Amount (Rs.)", 450, tableTop, { align: "right" });

//     doc.moveDown();
//     doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

//     doc.font("Helvetica");

//     const row = (y, text, amount) => {

//       doc.text(text, 50, y);

//       doc.text(`Rs. ${Number(amount).toFixed(2)}`, 450, y, {
//         align: "right"
//       });

//     };

//     let rowY = doc.y + 10;

//     row(rowY, "Payment Amount", amount);

//     doc.moveDown(5);

//     // ===== FOOTER =====

//     doc.moveDown(3);

//     doc
//       .fontSize(11)
//       .text("Payment received by the above mentioned person.", {
//         align: "center"
//       });

//     doc.moveDown(0.5);

//     doc
//       .fontSize(10)
//       .text("This is a system generated voucher.", {
//         align: "center"
//       });

//     doc.end();


//     // ===== UPLOAD TO CLOUDINARY =====

//     stream.on("finish", async () => {

//       try {

//         const result = await cloudinary.uploader.upload(pdfPath, {
//           resource_type: "raw",
//           folder: "vouchers",
//           type: "upload"
//         });

//         const voucher = new Voucher({

//           voucherNumber,
//           receiverType,
//           receiverName,
//           purpose,
//           amount,
//           paymentMethod,
//           date: date || new Date(),
//           pdfUrl: result.secure_url

//         });

//         const savedVoucher = await voucher.save();

//         fs.unlinkSync(pdfPath);

//         return res.status(201).json({
//           message: "Voucher generated successfully",
//           voucher: savedVoucher
//         });

//       } catch (uploadError) {

//         return res.status(500).json({
//           error: "PDF upload failed",
//           details: uploadError.message
//         });

//       }

//     });

//   } catch (error) {

//     res.status(500).json({ error: error.message });

//   }

// };



// // ===== GET ALL VOUCHERS =====

// exports.getAllVouchers = async (req, res) => {

//   try {

//     const vouchers = await Voucher.find();

//     res.status(200).json({
//       count: vouchers.length,
//       vouchers
//     });

//   } catch (error) {

//     res.status(500).json({ error: error.message });

//   }

// };



// // ===== GET VOUCHER BY ID =====

// exports.getVoucherById = async (req, res) => {

//   try {

//     const voucher = await Voucher.findById(req.params.id);

//     if (!voucher) {
//       return res.status(404).json({
//         message: "Voucher not found"
//       });
//     }

//     res.status(200).json(voucher);

//   } catch (error) {

//     res.status(500).json({ error: error.message });

//   }

// };



// // ===== UPDATE VOUCHER =====

// exports.updateVoucher = async (req, res) => {

//   try {

//     const voucher = await Voucher.findById(req.params.id);

//     if (!voucher) {
//       return res.status(404).json({
//         message: "Voucher not found"
//       });
//     }

//     if (req.body.receiverType !== undefined)
//       voucher.receiverType = req.body.receiverType;

//     if (req.body.receiverName !== undefined)
//       voucher.receiverName = req.body.receiverName;

//     if (req.body.purpose !== undefined)
//       voucher.purpose = req.body.purpose;

//     if (req.body.amount !== undefined)
//       voucher.amount = Number(req.body.amount);

//     if (req.body.paymentMethod !== undefined)
//       voucher.paymentMethod = req.body.paymentMethod;

//     if (req.body.date !== undefined)
//       voucher.date = new Date(req.body.date);

//     const updatedVoucher = await voucher.save();

//     res.status(200).json({
//       message: "Voucher updated successfully",
//       voucher: updatedVoucher
//     });

//   } catch (error) {

//     res.status(500).json({ error: error.message });

//   }

// };



// // ===== DELETE VOUCHER =====

// exports.deleteVoucher = async (req, res) => {

//   try {

//     const voucher = await Voucher.findById(req.params.id);

//     if (!voucher) {
//       return res.status(404).json({
//         message: "Voucher not found"
//       });
//     }

//     await voucher.deleteOne();

//     res.status(200).json({
//       message: "Voucher deleted successfully"
//     });

//   } catch (error) {

//     res.status(500).json({ error: error.message });

//   }

// };

const cloudinary = require("../config/cloudinary");
const Voucher = require("../models/Voucher");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


// ===== CREATE VOUCHER =====
exports.createVoucher = async (req, res) => {
  try {

    const {
      receiverType,
      receiverName,
      purpose,
      amount,
      paidAmount = 0,
      paymentMethod,
      date
    } = req.body;

    if (!receiverType || !receiverName || !purpose || !amount) {
      return res.status(400).json({
        message: "receiverType, receiverName, purpose and amount are required"
      });
    }

    // ===== CALCULATION =====
    const totalAmount = Number(amount);
    const paid = Number(paidAmount);
    const balance = totalAmount - paid;

    // ===== GENERATE VOUCHER NUMBER =====
    const lastVoucher = await Voucher.findOne().sort({ createdAt: -1 });

    let voucherNumber = "VO001";

    if (lastVoucher && lastVoucher.voucherNumber) {
      const num = parseInt(lastVoucher.voucherNumber.substring(2)) + 1;
      voucherNumber = "VO" + String(num).padStart(3, "0");
    }

    // ===== PDF GENERATION =====
    const pdfPath = path.join(__dirname, `../${voucherNumber}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // ===== HEADER =====
    doc.fontSize(20).font("Helvetica-Bold").text("DESIGN ART", { align: "center" });

    doc.fontSize(12).font("Helvetica")
      .text("(Interior and Exterior Solution)", { align: "center" });

    doc.fontSize(10)
      .text("Accounts Master Ledger", { align: "center" });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(2);

    // ===== TITLE =====
    doc.fontSize(18).font("Helvetica-Bold")
      .text("PAYMENT VOUCHER", { align: "center" });

    doc.moveDown(2);
    doc.fontSize(11).font("Helvetica");

    const labelX = 50;
    const valueX = 200;

    doc.text("Voucher Number :", labelX, doc.y);
    doc.text(voucherNumber, valueX, doc.y - 14);

    doc.moveDown();

    doc.text("Date :", labelX, doc.y);
    doc.text(
      date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString(),
      valueX,
      doc.y - 14
    );

    doc.moveDown();

    doc.text("Receiver Type :", labelX, doc.y);
    doc.text(receiverType, valueX, doc.y - 14);

    doc.moveDown();

    doc.text("Paid To :", labelX, doc.y);
    doc.text(receiverName, valueX, doc.y - 14);

    doc.moveDown();

    doc.text("Purpose :", labelX, doc.y);
    doc.text(purpose, valueX, doc.y - 14);

    doc.moveDown();

    doc.text("Payment Method :", labelX, doc.y);
    doc.text(paymentMethod || "cash", valueX, doc.y - 14);

    doc.moveDown(2);

    // ===== TABLE =====
    const tableTop = doc.y;

    doc.font("Helvetica-Bold")
      .text("Description", 50, tableTop)
      .text("Amount (Rs.)", 450, tableTop, { align: "right" });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.font("Helvetica");

    const row = (y, text, amount) => {
      doc.text(text, 50, y);
      doc.text(`Rs. ${Number(amount).toFixed(2)}`, 450, y, { align: "right" });
    };

    let rowY = doc.y + 10;

    row(rowY, "Total Amount", totalAmount);
    rowY += 20;

    row(rowY, "Paid Amount", paid);
    rowY += 20;

    row(rowY, "Balance Amount", balance);

    doc.moveDown(3);

    // ===== FOOTER =====
    // doc.fontSize(11)
    //   .text("Payment received by the above mentioned person.", {
    //     align: "center"
    //   });

    // doc.moveDown(0.5);

    // doc.fontSize(10)
    //   .text("This is a system generated voucher.", {
    //     align: "center"
    //   });

    // doc.end();

     // ===== FOOTER =====

    doc.moveDown(3);

    doc
      .fontSize(11)
      .text("Payment received by the above mentioned person.", {
        align: "center"
      });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .text("This is a system generated voucher.", {
        align: "center"
      });

    doc.end();

    // ===== UPLOAD TO CLOUDINARY =====
    stream.on("finish", async () => {
      try {

        const result = await cloudinary.uploader.upload(pdfPath, {
          resource_type: "raw",
          folder: "vouchers",
          type: "upload"
        });

        const voucher = new Voucher({
          voucherNumber,
          receiverType,
          receiverName,
          purpose,
          amount: totalAmount,
          paidAmount: paid,
          balanceAmount: balance,
          paymentMethod,
          date: date || new Date(),
          pdfUrl: result.secure_url
        });

        const savedVoucher = await voucher.save();

        fs.unlinkSync(pdfPath);

        return res.status(201).json({
          message: "Voucher generated successfully",
          voucher: savedVoucher
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


// ===== GET ALL =====
exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.status(200).json({
      count: vouchers.length,
      vouchers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ===== GET BY ID =====
exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    res.status(200).json(voucher);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ===== UPDATE =====
// exports.updateVoucher = async (req, res) => {
//   try {
//     const voucher = await Voucher.findById(req.params.id);

//     if (!voucher) {
//       return res.status(404).json({ message: "Voucher not found" });
//     }

//     Object.assign(voucher, req.body);

//     const updatedVoucher = await voucher.save();

//     res.status(200).json({
//       message: "Voucher updated successfully",
//       voucher: updatedVoucher
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.updateVoucher = async (req, res) => {
    try {
      const voucher = await Voucher.findById(req.params.id);
  
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
  
      // ✅ Update fields manually (safe way)
      if (req.body.receiverType !== undefined)
        voucher.receiverType = req.body.receiverType;
  
      if (req.body.receiverName !== undefined)
        voucher.receiverName = req.body.receiverName;
  
      if (req.body.purpose !== undefined)
        voucher.purpose = req.body.purpose;
  
      if (req.body.amount !== undefined)
        voucher.amount = Number(req.body.amount);
  
      if (req.body.paidAmount !== undefined)
        voucher.paidAmount = Number(req.body.paidAmount);
  
      if (req.body.paymentMethod !== undefined)
        voucher.paymentMethod = req.body.paymentMethod;
  
      if (req.body.date !== undefined)
        voucher.date = new Date(req.body.date);
  
      // ✅ VERY IMPORTANT (recalculate)
      voucher.balanceAmount = voucher.amount - voucher.paidAmount;
  
      const updatedVoucher = await voucher.save();
  
      res.status(200).json({
        message: "Voucher updated successfully",
        voucher: updatedVoucher
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

// ===== DELETE =====
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    await voucher.deleteOne();

    res.status(200).json({
      message: "Voucher deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};