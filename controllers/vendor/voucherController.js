const Voucher = require("../../models/vendor/Voucher");
const Purchase = require("../../models/vendor/Purchase");
const Vendor = require("../../models/vendor/Vendor");
const WorkSubcontract = require("../../models/subcontractor/WorkSubcontract");
const Subcontract = require("../../models/subcontractor/Subcontract");

const cloudinary = require("../../config/cloudinary");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// without purchase bill
// {
//   "receiverType": "Vendor",
//   "receiver": "69ff29dc220c81661cbc38c7",
//   "vendorId": "69ff29dc220c81661cbc38c7",
//   "date": "2026-05-09",
//   "purpose": "General Expense Payment",
//   "amount": 5000,
//   "paymentMethod": "cash",
//   "notes": "Office expense payment"
// }


// voucher with purchase bill Id
// {
//   "receiverType": "Vendor",
//   "receiver": "69ff29dc220c81661cbc38c7",
//   "purchaseId": "69ff2c86fb346d6e719dd868",
//   "purpose": "Purchase Bill Payment",
//   "amount": 8000,
//   "paymentMethod": "online",
//   "notes": "Partial payment for material purchase"
// }


// Without workSubcontract ID
// {
//   "subcontract": "69ff78853f3d51a068059fed",
//   "projectName": "College Building Painting",
//   "description": "Interior and exterior painting work",
//   "startDate": "2026-05-01",
//   "endDate": "2026-06-15",
//   "totalAmount": 8000,
//   "gstPercent": 18
// }

// ===============================
// CREATE VOUCHER
// ===============================

exports.createVoucher = async (req, res) => {
  try {

    const {
      purchaseId,
      vendorId,
      workSubcontractId,
      subcontractId,
      receiverType,
      receiver,
      purpose,
      amountInVoucher,
      paymentMethod,
      notes
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!amountInVoucher || amountInVoucher <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }

    let purchase = null;
    let vendor = null;

    let workSubcontract = null;
    let subcontract = null;

    let advanceAmount = 0;
    let newCumulativePaidAmount = 0;

    let totalAmount = 0;
    let outstandingAmount = 0;

    // =====================================================
    // PURCHASE / VENDOR FLOW
    // =====================================================

    if (purchaseId || vendorId) {

      // ===============================
      // PURCHASE PAYMENT
      // ===============================

      if (purchaseId) {

        purchase = await Purchase
          .findById(purchaseId)
          .populate("vendor");

        if (!purchase) {
          return res.status(404).json({
            message: "Purchase not found"
          });
        }

        vendor = purchase.vendor;

      }

      // ===============================
      // ADVANCE VENDOR PAYMENT
      // ===============================

      else if (vendorId) {

        vendor = await Vendor.findById(vendorId);

        if (!vendor) {
          return res.status(404).json({
            message: "Vendor not found"
          });
        }

        // CHECK PENDING PURCHASE

        const pendingPurchase = await Purchase.findOne({
          vendor: vendor._id,
          paymentStatus: { $in: ["Unpaid", "Partial"] }
        });

        if (pendingPurchase) {

          const pendingAmount =
            pendingPurchase.grandTotal -
            pendingPurchase.cumulativePaidAmount;

          return res.status(400).json({
            message:
              `Pending purchase amount Rs.${pendingAmount} exists for this vendor. Please pay the purchase directly instead of creating advance payment.`
          });
        }
      }

      // ===============================
      // PURCHASE PAYMENT LOGIC
      // ===============================

      if (purchase) {

        const remainingAmount =
          purchase.grandTotal -
          purchase.cumulativePaidAmount;

        // OVER PAYMENT

        if (amountInVoucher > remainingAmount) {

          advanceAmount =
            amountInVoucher - remainingAmount;

          newCumulativePaidAmount =
            purchase.grandTotal;

        }

        // NORMAL PAYMENT

        else {

          newCumulativePaidAmount =
            purchase.cumulativePaidAmount +
            amountInVoucher;

        }

        let paymentStatus = "Unpaid";

        if (
          newCumulativePaidAmount > 0 &&
          newCumulativePaidAmount < purchase.grandTotal
        ) {

          paymentStatus = "Partial";

        }

        else if (
          newCumulativePaidAmount >= purchase.grandTotal
        ) {

          paymentStatus = "Paid";

        }

        purchase.cumulativePaidAmount =
          newCumulativePaidAmount;

        purchase.paymentStatus =
          paymentStatus;

        await purchase.save();

        totalAmount = purchase.grandTotal;

        outstandingAmount =
          purchase.grandTotal -
          newCumulativePaidAmount;
      }
    }

    // =====================================================
    // WORK SUBCONTRACT / SUBCONTRACT FLOW
    // =====================================================

    else if (workSubcontractId || subcontractId) {

      // ===============================
      // WORK SUBCONTRACT PAYMENT
      // ===============================

      if (workSubcontractId) {

        workSubcontract = await WorkSubcontract
          .findById(workSubcontractId)
          .populate("subcontract");

        if (!workSubcontract) {
          return res.status(404).json({
            message: "Work subcontract not found"
          });
        }

        subcontract = workSubcontract.subcontract;
      }

      // ===============================
      // ADVANCE SUBCONTRACT PAYMENT
      // ===============================

      else if (subcontractId) {

        subcontract = await Subcontract.findById(subcontractId);

        if (!subcontract) {
          return res.status(404).json({
            message: "Subcontract not found"
          });
        }

        // CHECK PENDING WORK SUBCONTRACT

        const pendingWorkSubcontract =
          await WorkSubcontract.findOne({
            subcontract: subcontract._id,
            paymentStatus: { $in: ["Unpaid", "Partial"] }
          });

        if (pendingWorkSubcontract) {

          const pendingAmount =
            pendingWorkSubcontract.grandTotal -
            pendingWorkSubcontract.cumulativePaidAmount;

          return res.status(400).json({
            message:
              `Pending work subcontract amount Rs.${pendingAmount} exists for this subcontract. Please pay the work subcontract directly instead of creating advance payment.`
          });
        }
      }

      // ===============================
      // WORK SUBCONTRACT PAYMENT LOGIC
      // ===============================

      if (workSubcontract) {

        const remainingAmount =
          workSubcontract.grandTotal -
          workSubcontract.cumulativePaidAmount;

        // OVER PAYMENT

        if (amountInVoucher > remainingAmount) {

          advanceAmount =
            amountInVoucher - remainingAmount;

          newCumulativePaidAmount =
            workSubcontract.grandTotal;

        }

        // NORMAL PAYMENT

        else {

          newCumulativePaidAmount =
            workSubcontract.cumulativePaidAmount +
            amountInVoucher;

        }

        let paymentStatus = "Unpaid";

        if (
          newCumulativePaidAmount > 0 &&
          newCumulativePaidAmount < workSubcontract.grandTotal
        ) {

          paymentStatus = "Partial";

        }

        else if (
          newCumulativePaidAmount >= workSubcontract.grandTotal
        ) {

          paymentStatus = "Paid";

        }

        workSubcontract.cumulativePaidAmount =
          newCumulativePaidAmount;

        workSubcontract.paymentStatus =
          paymentStatus;

        await workSubcontract.save();

        totalAmount = workSubcontract.grandTotal;

        outstandingAmount =
          workSubcontract.grandTotal -
          newCumulativePaidAmount;
      }
    }

    // ===============================
    // INVALID REQUEST
    // ===============================

    else {

      return res.status(400).json({
        message:
          "Either purchase/vendor or workSubcontract/subcontract is required"
      });

    }

    // ===============================
    // GENERATE VOUCHER NUMBER
    // ===============================

    const lastVoucher =
      await Voucher.findOne().sort({ createdAt: -1 });

    let voucherNumber = "VCH0001";

    if (lastVoucher) {

      const num =
        parseInt(lastVoucher.voucherNumber.substring(3)) + 1;

      voucherNumber =
        "VCH" + String(num).padStart(4, "0");
    }

    // ===============================
    // TEMP PDF PATH
    // ===============================

    const uploadDir =
      path.join(__dirname, "../../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const pdfPath =
      path.join(uploadDir, `${voucherNumber}.pdf`);

    const doc = new PDFDocument({ margin: 50 });

    const stream =
      fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // ===============================
    // HEADER
    // ===============================

    const startX = 50;
    const startY = 50;

    const logoPath =
      path.join(__dirname, "../../assets/logo.jpeg");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, startX, startY, {
        width: 110
      });
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

    const lineY =
      Math.max(doc.y + 10, startY + 100);

    doc.moveTo(50, lineY)
      .lineTo(550, lineY)
      .stroke();

    // ===============================
    // TITLE
    // ===============================

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(
        "PAYMENT VOUCHER",
        0,
        lineY + 20,
        { align: "center" }
      );

    // ===============================
    // INFO BOX
    // ===============================

    const boxTop = lineY + 60;

    doc.rect(50, boxTop, 500, 120).stroke();

    doc.fontSize(11).font("Helvetica");

    let infoY = boxTop + 15;

    const infoRow = (label, value) => {
      doc.text(label, 70, infoY);
      doc.text(value || "-", 220, infoY);
      infoY += 20;
    };

    infoRow("Voucher Number:", voucherNumber);

    infoRow(
      "Reference:",
      purchase
        ? purchase.purchaseNumber || purchase._id.toString()
        : workSubcontract
        ? workSubcontract.workOrderNumber ||
          workSubcontract._id.toString()
        : "Advance Payment"
    );

    infoRow(
      "Date:",
      new Date().toLocaleDateString()
    );

    infoRow(
      "Receiver Type:",
      receiverType
    );

    infoRow(
      "Purpose:",
      purpose
    );

    infoRow(
      "Payment Method:",
      paymentMethod
    );

    // ===============================
    // TABLE
    // ===============================

    const tableTop = boxTop + 150;

    doc
      .font("Helvetica-Bold")
      .text("Description", 70, tableTop)
      .text("Amount (Rs.)", 400, tableTop, {
        align: "right"
      });

    doc.moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font("Helvetica");

    let y = tableTop + 35;

    const row = (label, value) => {
      doc.text(label, 70, y);

      doc.text(
        `Rs. ${Number(value).toFixed(2)}`,
        400,
        y,
        { align: "right" }
      );

      y += 25;
    };

    // ===============================
    // TABLE DATA
    // ===============================

    if (purchase || workSubcontract) {

      row("Total Amount", totalAmount);

      row("Amount Paid Now", amountInVoucher);

      row(
        "Total Paid Till Now",
        newCumulativePaidAmount
      );

      row(
        "Outstanding Amount",
        outstandingAmount
      );

      if (advanceAmount > 0) {
        row("Advance Amount", advanceAmount);
      }

    }

    else {

      row("Advance Payment", amountInVoucher);

    }

    doc.moveTo(50, y)
      .lineTo(550, y)
      .stroke();

    // ===============================
    // FOOTER
    // ===============================

    doc
      .fontSize(9)
      .text(
        "This is a system generated voucher.",
        50,
        y + 40,
        {
          align: "center",
          width: 500
        }
      );

    doc.end();

    // ===============================
    // CLOUDINARY UPLOAD
    // ===============================

    stream.on("finish", async () => {

      try {

        const result =
          await cloudinary.uploader.upload(
            pdfPath,
            {
              resource_type: "raw",
              folder: "vouchers"
            }
          );

        const voucher = new Voucher({

          voucherNumber,

          vendor:
            vendor ? vendor._id : null,

          subcontract:
            subcontract ? subcontract._id : null,

          receiverType,
          receiver,

          appliedPurchases:
            purchase
              ? [
                  {
                    purchase: purchase._id,
                    usedAmount:
                      amountInVoucher - advanceAmount
                  }
                ]
              : [],

          appliedWorkSubcontracts:
            workSubcontract
              ? [
                  {
                    workSubcontract:
                      workSubcontract._id,
                    usedAmount:
                      amountInVoucher - advanceAmount
                  }
                ]
              : [],

          amountInVoucher: amountInVoucher,

          remainingAmount:
            purchase || workSubcontract
              ? advanceAmount
              : amountInVoucher,

          purpose,
          paymentMethod,
          notes,

          pdfUrl: result.secure_url
        });

        const savedVoucher =
          await voucher.save();

        fs.unlinkSync(pdfPath);

        res.status(201).json({
          message: "Voucher created successfully",
          voucher: savedVoucher,
          advanceAmount
        });

      }

      catch (err) {

        res.status(500).json({
          error: "Cloudinary upload failed",
          details: err.message
        });

      }

    });

  }

  catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



// exports.createVoucher = async (req, res) => {
//   try {

//     const {
//       purchaseId,
//       vendorId,
//       workSubcontractId,
//       subcontractId,
//       receiverType,
//       receiver,
//       purpose,
//       amountInVoucher,
//       paymentMethod,
//       notes
//     } = req.body;

//     if (!amountInVoucher || amountInVoucher <= 0) {
//       return res.status(400).json({ message: "Amount must be greater than 0" });
//     }

//     let purchase = null;
//     let workSubcontract = null;

//     let totalAmount = 0;
//     let newCumulativePaidAmount = 0;
//     let outstandingAmount = 0;
//     let vendor = null;
//     let subcontract = null;

//     // ===============================
//     // PURCHASE PAYMENT
//     // ===============================


//     if (purchaseId) {
    
//       purchase = await Purchase.findById(purchaseId).populate("vendor");
    
//       if (!purchase) {
//         return res.status(404).json({ message: "Purchase not found" });
//       }
//       vendor = purchase.vendor;
    
//     }

//     else if (vendorId) {
    
//       vendor = await Vendor.findById(vendorId);
    
//       if (!vendor) {
//         return res.status(404).json({
//           message: "vendor not found"
//         });
//       }
    
//       // CHECK PENDING PURCHASE
      
//       const pendingPurchase = await Purchase.findOne({
//         vendor: vendor._id,
//         paymentStatus: { $in: ["Unpaid", "Partial"] }
//       });
    
//       if (pendingPurchase) {
    
//         const pendingAmount =
//         pendingPurchase.grandTotal -
//         pendingPurchase.cumulativePaidAmount;
    
//         return res.status(400).json({
//           message:
//             `Pending purchase amount Rs.${pendingAmount} exists for this vendor. Please pay the purchase directly instead of creating advance purchase.`
//           });
//         }
//     }

//     else {
//       return res.status(400).json({
//         message: "Either purchaseId or vendorId is required"
//       });

//     }

//     let advanceAmount = 0;
//     let newcumulativePaidAmount = 0;

//     if (purchase) {

//       // cumulativePaidAmount means already paid amount till noe for this invoice
//       const remainingAmount = purchase.grandTotal - purchase.cumulativePaidAmount;
//       // newly paid amount is 'paidAmountInReceipt'
//       if (amountInVoucher > remainingAmount) {
//         // calculate advance amount
//         advanceAmount = amountInVoucher - remainingAmount;
//         // assume 
//         newcumulativePaidAmount = purchase.grandTotal;

//       } else {

//         newcumulativePaidAmount = purchase.cumulativePaidAmount + amountInVoucher;

//       }

//       let paymentStatus = "Unpaid";

//       if (newcumulativePaidAmount > 0 && newcumulativePaidAmount < purchase.grandTotal) {
//         paymentStatus = "Partial";
//       }
//       else if (newcumulativePaidAmount >= purchase.grandTotal) {
//         paymentStatus = "Paid";
//       }

//       purchase.cumulativePaidAmount = newcumulativePaidAmount;
//       purchase.paymentStatus = paymentStatus;

//       await purchase.save();

//     }

  
//     // ===============================
//     // WORK SUBCONTRACT PAYMENT
//     // ===============================


//     else if (workSubcontractId) {

//       workSubcontract = await WorkSubcontract
//         .findById(workSubcontractId)
//         .populate("subcontract");

//       if (!workSubcontract) {
//         return res.status(404).json({
//           message: "Work subcontract not found"
//         });
//       }

//       subcontract = workSubcontract.subcontract;

//     }

//     else if (subcontractId) {

//       subcontract = await Subcontract.findById(subcontractId);

//       if (!subcontract) {
//         return res.status(404).json({
//           message: "Subcontract not found"
//         });
//       }

//       // CHECK PENDING WORK SUBCONTRACT

//       const pendingWorkSubcontract = await WorkSubcontract.findOne({
//         subcontract: subcontract._id,
//         paymentStatus: { $in: ["Unpaid", "Partial"] }
//       });

//       if (pendingWorkSubcontract) {

//         const pendingAmount =
//           pendingWorkSubcontract.grandTotal -
//           pendingWorkSubcontract.cumulativePaidAmount;

//         return res.status(400).json({
//           message:
//             `Pending work subcontract amount Rs.${pendingAmount} exists for this subcontract. Please pay the work subcontract directly instead of creating advance payment.`
//         });
//       }
//     }

//     else {

//       return res.status(400).json({
//         message: "Either workSubcontractId or subcontractId is required"
//       });

//     }

//     // PAYMENT LOGIC

//       let advanceAmount = 0;
//       let newcumulativePaidAmount = 0;

//       if (workSubcontract) {

//         // Remaining amount for this work subcontract
//         const remainingAmount =
//           workSubcontract.grandTotal -
//           workSubcontract.cumulativePaidAmount;

//         // If paid amount exceeds remaining amount
//         if (amountInVoucher > remainingAmount) {

//           // Extra amount becomes advance
//           advanceAmount = amountInVoucher - remainingAmount;

//           // Full payment completed
//           newcumulativePaidAmount = workSubcontract.grandTotal;

//         } else {

//           newcumulativePaidAmount =
//             workSubcontract.cumulativePaidAmount + amountInVoucher;
//         }

//         let paymentStatus = "Unpaid";

//         if (newcumulativePaidAmount > 0 && newcumulativePaidAmount < workSubcontract.grandTotal) {
//           paymentStatus = "Partial";
//         }
//         else if (newcumulativePaidAmount >= workSubcontract.grandTotal) {
//           paymentStatus = "Paid";
//         }

//         workSubcontract.cumulativePaidAmount = newcumulativePaidAmount;
//         workSubcontract.paymentStatus = paymentStatus;
//         await workSubcontract.save();
//       }


//     // ===============================
//     // GENERATE VOUCHER NUMBER
//     // ===============================

//     const lastVoucher = await Voucher.findOne().sort({ createdAt: -1 });

//     let voucherNumber = "VCH0001";

//     if (lastVoucher) {
//       const num = parseInt(lastVoucher.voucherNumber.substring(3)) + 1;
//       voucherNumber = "VCH" + String(num).padStart(4, "0");
//     }

//     // ===============================
//     // TEMP PDF
//     // ===============================

//     const uploadDir = path.join(__dirname, "../../uploads");

//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     const pdfPath = path.join(uploadDir, `${voucherNumber}.pdf`);

//     const doc = new PDFDocument({ margin: 50 });

//     const stream = fs.createWriteStream(pdfPath);

//     doc.pipe(stream);

//     // ===============================
//     // HEADER
//     // ===============================

//     const startX = 50;
//     const startY = 50;

//     const logoPath = path.join(__dirname, "../../assets/logo.jpeg");

//     if (fs.existsSync(logoPath)) {
//       doc.image(logoPath, startX, startY, { width: 110 });
//     }

//     const rightX = 180;

//     doc
//       .font("Helvetica-Bold")
//       .fontSize(16)
//       .text("DESIGN ART", rightX, startY);

//     doc.moveDown(0.5);

//     doc
//       .font("Helvetica")
//       .fontSize(10)
//       .text(
//         "5-6, Indria Nagar, PM Samy Colony, Ratinapuri, Gandhipuram, Coimbatore - 641012",
//         rightX,
//         doc.y,
//         { width: 350 }
//       );

//     doc.moveDown(0.3);

//     doc.text(
//       "Phone: +91 9677731326 | GST: 33BNCPP2332Q1ZT",
//       rightX,
//       doc.y,
//       { width: 350 }
//     );

//     const lineY = Math.max(doc.y + 10, startY + 100);

//     doc.moveTo(50, lineY).lineTo(550, lineY).stroke();

//     // ===============================
//     // TITLE
//     // ===============================

//     doc
//       .fontSize(18)
//       .font("Helvetica-Bold")
//       .text("PAYMENT VOUCHER", 0, lineY + 20, { align: "center" });

//     // ===============================
//     // INFO BOX
//     // ===============================

//     const boxTop = lineY + 60;

//     doc.rect(50, boxTop, 500, 120).stroke();

//     doc.fontSize(11).font("Helvetica");

//     let infoY = boxTop + 15;

//     const infoRow = (label, value) => {
//       doc.text(label, 70, infoY);
//       doc.text(value || "-", 200, infoY);
//       infoY += 20;
//     };

//     infoRow("Voucher Number:", voucherNumber);
//     infoRow("Date:", new Date().toLocaleDateString());
//     infoRow("Receiver Type:", receiverType);
//     infoRow("Purpose:", purpose);
//     infoRow("Payment Method:", paymentMethod);

//     // ===============================
//     // TABLE
//     // ===============================

//     const tableTop = boxTop + 150;

//     doc
//       .font("Helvetica-Bold")
//       .text("Description", 70, tableTop)
//       .text("Amount (Rs.)", 400, tableTop, { align: "right" });

//     doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

//     doc.font("Helvetica");

//     let y = tableTop + 35;

//     const row = (label, value) => {
//       doc.text(label, 70, y);
//       doc.text(`Rs. ${Number(value).toFixed(2)}`, 400, y, { align: "right" });
//       y += 25;
//     };

//     if (!purchase && !workSubcontract) {

//       // ADVANCE PAYMENT VOUCHER
//       row("Amount Paid", amountInVoucher);

//     } else {

//       // NORMAL PAYMENT VOUCHER
//       row("Total Amount", totalAmount);
//       row("Amount Paid Now", amount);
//       row("Total Paid Till Now", newCumulativePaidAmount);
//       row("Outstanding Amount", outstandingAmount);

//     }

//     doc.moveTo(50, y).lineTo(550, y).stroke();

//     // ===============================
//     // FOOTER
//     // ===============================

//     doc
//       .fontSize(9)
//       .text("This is a system generated voucher.", 50, y + 40, {
//         align: "center",
//         width: 500
//       });

//     doc.end();

//     // ===============================
//     // CLOUDINARY UPLOAD
//     // ===============================

//     stream.on("finish", async () => {

//       try {

//         const result = await cloudinary.uploader.upload(pdfPath, {
//           resource_type: "raw",
//           folder: "vouchers"
//         });

//         const voucher = new Voucher({

//         voucherNumber,

//         vendor: vendor ? vendor._id : null,
//         subcontract: subcontract ? subcontract._id : null,
//         receiverType,
//         receiver,
//         appliedPurchases:
//           purchase
//             ? [
//                 {
//                   purchase: purchase._id,
//                   usedAmount: amount
//                 }
//               ]
//             : [],

//         appliedWorkSubcontracts:
//           workSubcontract
//             ? [
//                 {
//                   workSubcontract: workSubcontract._id,
//                   usedAmount: amount
//                 }
//               ]
//             : [],

//         amount,
//         remainingAmount : purchase || workSubcontract ? 0 : amount,
//         purpose,
//         paymentMethod,
//         notes,
//         pdfUrl: result.secure_url
//       });

//         const savedVoucher = await voucher.save();

//         fs.unlinkSync(pdfPath);

//         res.status(201).json({
//           message: "Voucher created successfully",
//           voucher: savedVoucher
//         });

//       } catch (err) {

//         res.status(500).json({
//           error: "Cloudinary upload failed",
//           details: err.message
//         });

//       }

//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



// ===============================
// GET ALL VOUCHERS
// ===============================
exports.getAllVouchers = async (req, res) => {

  try {

    const vouchers = await Voucher.find()

      .populate("vendor", "vendorId name")

      .populate("subcontract", "name subcontractCode")

      .populate({
        path: "appliedPurchases.purchase",
        populate: {
          path: "vendor",
          select: "vendorId name"
        }
      })

      .populate({
        path: "appliedWorkSubcontracts.workSubcontract",
        populate: {
          path: "subcontract",
          select: "name subcontractCode"
        }
      });

    res.status(200).json({
      count: vouchers.length,
      data: vouchers
    });

  }

  catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};


// ===============================
// GET VOUCHER BY ID
// ===============================
exports.getVoucherById = async (req, res) => {

  try {

    const voucher = await Voucher.findById(
      req.params.voucherId
    )

      .populate("vendor", "vendorId name")

      .populate(
        "subcontract",
        "name subcontractCode"
      )

      .populate({
        path: "appliedPurchases.purchase",
        populate: {
          path: "vendor",
          select: "vendorId name"
        }
      })

      .populate({
        path:
          "appliedWorkSubcontracts.workSubcontract",

        populate: {
          path: "subcontract",
          select: "name subcontractCode"
        }
      });

    if (!voucher) {

      return res.status(404).json({
        message: "Voucher not found"
      });

    }

    res.status(200).json({
      data: voucher
    });

  }

  catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

// ===============================
// GET VOUCHERS BY PURCHASE ID
// ===============================
exports.getVouchersByPurchaseId = async (req, res) => {

  try {

    const vouchers = await Voucher.find({
      "appliedPurchases.purchase":
        req.params.purchaseId
    })

    .populate("vendor", "vendorId name")

    .populate({
      path: "appliedPurchases.purchase",

      populate: {
        path: "vendor",
        select: "vendorId name"
      }
    });

    res.status(200).json({
      count: vouchers.length,
      data: vouchers
    });

  }

  catch (error) {

    res.status(500).json({
      message: "Error fetching vouchers",
      error: error.message
    });

  }

};


exports.getVouchersByWorkSubcontractId = async (req, res) => {

  try {

    const vouchers = await Voucher.find({
      "appliedWorkSubcontracts.workSubcontract":
        req.params.workSubcontractId
    })

    .populate(
      "subcontract",
      "name subcontractCode"
    )

    .populate({
      path:
        "appliedWorkSubcontracts.workSubcontract",

      populate: {
        path: "subcontract",
        select: "name subcontractCode"
      }
    });

    res.status(200).json({
      count: vouchers.length,
      data: vouchers
    });

  }

  catch (error) {

    res.status(500).json({
      message: "Error fetching vouchers",
      error: error.message
    });

  }

};

// ===============================
// UPDATE VOUCHER
// ===============================

// {
//   "receiverType": "Subcontract",
//   "receiver": "69ff78853f3d51a068059fed",
//   "subcontractId": "69ff78853f3d51a068059fed",
//   "workSubcontractId": "69ff85af7159769874129aed",
//   "date": "2026-05-09",
//   "purpose": "General Expense Payment",
//   "amount": 2000,
//   "paymentMethod": "cash",
//   "notes": "Office expense payment"
// }

exports.updateVoucher = async (req, res) => {
  try {

    const { voucherId } = req.params;

    const {
      date,
      purpose,
      notes,
      paymentMethod,
      amountInVoucher
    } = req.body;

    const voucher = await Voucher.findById(voucherId)
      .populate("vendor")
      .populate("subcontract")
      .populate("appliedPurchases.purchase")
      .populate("appliedWorkSubcontracts.workSubcontract");

    if (!voucher) {
      return res.status(404).json({
        message: "Voucher not found"
      });
    }

    // ===============================
    // CHECK CONNECTION
    // ===============================

    const purchaseConnected =
      voucher.appliedPurchases &&
      voucher.appliedPurchases.length > 0;

    const workSubcontractConnected =
      voucher.appliedWorkSubcontracts &&
      voucher.appliedWorkSubcontracts.length > 0;

    const isConnected =
      purchaseConnected || workSubcontractConnected;

    // ===============================
    // RESTRICT FINANCIAL EDITS
    // ===============================

    if (
      isConnected &&
      amountInVoucher !== undefined
    ) {

      return res.status(400).json({
        message:
          "This voucher is already connected with purchase/work subcontract. Amount cannot be edited."
      });
    }

    // ===============================
    // UPDATE AMOUNT
    // ONLY FOR ADVANCE VOUCHER
    // ===============================

    if (amountInVoucher !== undefined) {

      const newAmount =
        Number(amountInVoucher);

      if (newAmount <= 0) {

        return res.status(400).json({
          message:
            "Amount must be greater than 0"
        });
      }

      voucher.amountInVoucher =
        newAmount;

      voucher.remainingAmount =
        newAmount;
    }

    // ===============================
    // UPDATE OTHER FIELDS
    // ===============================

    if (date !== undefined) {

      voucher.date =
        new Date(date);
    }

    if (purpose !== undefined) {

      voucher.purpose =
        purpose;
    }

    if (notes !== undefined) {

      voucher.notes =
        notes;
    }

    if (paymentMethod !== undefined) {

      voucher.paymentMethod =
        paymentMethod;
    }

    await voucher.save();

    // ===============================
    // PDF DATA
    // ===============================

    const purchase =
      purchaseConnected
        ? voucher.appliedPurchases[0].purchase
        : null;

    const workSubcontract =
      workSubcontractConnected
        ? voucher.appliedWorkSubcontracts[0]
            .workSubcontract
        : null;

    const voucherNumber =
      voucher.voucherNumber;

    // ===============================
    // TEMP PDF
    // ===============================

    const uploadDir = path.join(
      __dirname,
      "../../uploads"
    );

    if (!fs.existsSync(uploadDir)) {

      fs.mkdirSync(uploadDir, {
        recursive: true
      });
    }

    const pdfPath = path.join(
      uploadDir,
      `${voucherNumber}.pdf`
    );

    const doc = new PDFDocument({
      margin: 50
    });

    const stream =
      fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // ===============================
    // HEADER
    // ===============================

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

    const lineY = Math.max(
      doc.y + 10,
      startY + 100
    );

    doc
      .moveTo(50, lineY)
      .lineTo(550, lineY)
      .stroke();

    // ===============================
    // TITLE
    // ===============================

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(
        "PAYMENT VOUCHER",
        0,
        lineY + 20,
        { align: "center" }
      );

    // ===============================
    // INFO BOX
    // ===============================

    const boxTop = lineY + 60;

    doc
      .rect(50, boxTop, 500, 120)
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
      "Voucher Number:",
      voucher.voucherNumber
    );

    infoRow(
      "Reference:",
      purchase
        ? (
            purchase.purchaseNumber ||
            purchase._id.toString()
          )
        : workSubcontract
        ? (
            workSubcontract.workOrderNumber ||
            workSubcontract._id.toString()
          )
        : "Advance Payment"
    );

    infoRow(
      "Date:",
      new Date(
        voucher.date
      ).toLocaleDateString()
    );

    infoRow(
      "Receiver Type:",
      voucher.receiverType
    );

    infoRow(
      "Purpose:",
      voucher.purpose
    );

    infoRow(
      "Payment Method:",
      voucher.paymentMethod
    );

    // ===============================
    // TABLE
    // ===============================

    const tableTop = boxTop + 150;

    doc
      .font("Helvetica-Bold")
      .text(
        "Description",
        70,
        tableTop
      )
      .text(
        "Amount (Rs.)",
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
        `Rs. ${Number(value).toFixed(2)}`,
        400,
        y,
        { align: "right" }
      );

      y += 25;
    };

    // ===============================
    // PURCHASE VOUCHER
    // ===============================

    if (purchase) {

      row(
        "Purchase Total",
        purchase.grandTotal
      );

      row(
        "Voucher Amount",
        voucher.amountInVoucher
      );

      row(
        "Total Paid Till Now",
        purchase.cumulativePaidAmount
      );

      row(
        "Outstanding Amount",
        Math.max(
          purchase.grandTotal -
          purchase.cumulativePaidAmount,
          0
        )
      );
    }

    // ===============================
    // WORK SUBCONTRACT VOUCHER
    // ===============================

    else if (workSubcontract) {

      row(
        "Work Subcontract Total",
        workSubcontract.grandTotal
      );

      row(
        "Voucher Amount",
        voucher.amountInVoucher
      );

      row(
        "Total Paid Till Now",
        workSubcontract.cumulativePaidAmount
      );

      row(
        "Outstanding Amount",
        Math.max(
          workSubcontract.grandTotal -
          workSubcontract.cumulativePaidAmount,
          0
        )
      );
    }

    // ===============================
    // ADVANCE VOUCHER
    // ===============================

    else {

      row(
        "Advance Payment",
        voucher.amountInVoucher
      );
    }

    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();

    // ===============================
    // FOOTER
    // ===============================

    doc
      .fontSize(9)
      .text(
        "This is a system generated voucher.",
        50,
        y + 40,
        {
          align: "center",
          width: 500
        }
      );

    doc.end();

    // ===============================
    // CLOUDINARY
    // ===============================

    stream.on("finish", async () => {

      try {

        const result =
          await cloudinary.uploader.upload(
            pdfPath,
            {
              resource_type: "raw",
              folder: "vouchers",
              public_id: voucherNumber,
              overwrite: true
            }
          );

        voucher.pdfUrl =
          result.secure_url;

        await voucher.save();

        fs.unlinkSync(pdfPath);

        res.status(200).json({
          message:
            "Voucher updated successfully",
          voucher
        });

      } catch (err) {

        res.status(500).json({
          error:
            "Cloudinary upload failed",
          details: err.message
        });
      }
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
};




// exports.updateVoucher = async (req, res) => {
//   try {

//     const { voucherId } = req.params;

//     const {
//       purchaseId,
//       vendorId,
//       workSubcontractId,
//       subcontractId,
//       date,
//       receiverType,
//       receiver,
//       purpose,
//       amount,
//       notes,
//       paymentMethod
//     } = req.body;

//     const voucher = await Voucher.findById(voucherId);

//     if (!voucher) {
//       return res.status(404).json({ message: "Voucher not found" });
//     }

//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         message: "Amount must be greater than 0"
//       });
//     }

//     const oldAmount = voucher.amount;

//     let purchase = null;
//     let workSubcontract = null;


//     let totalAmount = 0;
//     let newCumulativePaidAmount = 0;
//     let outstandingAmount = 0;

//     if (purchaseId) {

//       purchase = await Purchase.findById(purchaseId).populate("vendor");

//       if (!purchase) {
//         return res.status(404).json({
//           message: "Purchase not found"
//         });
//       }

//       // ===============================
//       // UPDATE CURRENT VOUCHER
//       // ===============================

//       voucher.amount = amount;

//       if (date) {
//         voucher.date = date;
//       }

//       voucher.purchase = purchaseId;
//       voucher.workSubcontract = null;

//       await voucher.save();

//       // ===============================
//       // DELETE OLD AUTO SPLIT VOUCHERS
//       // ===============================

//       const purchaseVouchersForDelete = await Voucher.find({
//         purchase: purchaseId
//       });

//       for (const item of purchaseVouchersForDelete) {

//         await Voucher.deleteMany({
//           voucherNumber: item.voucherNumber + "-A"
//         });
//       }

//       // ===============================
//       // GET UPDATED PURCHASE VOUCHERS
//       // ===============================

//       const purchaseVouchers = await Voucher.find({
//         purchase: purchaseId
//       }).sort({ createdAt: 1 });

//       let remainingBillAmount = purchase.grandTotal;

//       newCumulativePaidAmount = 0;

//       // ===============================
//       // RECALCULATE ALL VOUCHERS
//       // ===============================

//       for (const item of purchaseVouchers) {

//         // Bill already completed
//         if (remainingBillAmount <= 0) {

//           // Entire voucher becomes advance
//           item.purchase = null;

//           await item.save();

//           continue;
//         }

//         // Voucher fully usable
//         if (item.amount <= remainingBillAmount) {

//           remainingBillAmount -= item.amount;

//           newCumulativePaidAmount += item.amount;
//         }

//         // Voucher larger than remaining bill
//         else {

//           const usedAmount = remainingBillAmount;

//           const advanceAmount =
//             item.amount - usedAmount;

//           // Update original voucher
//           item.amount = usedAmount;

//           await item.save();

//           // Create advance voucher
//           const splitVoucher = new Voucher({
//             voucherNumber: item.voucherNumber + "-A",
//             vendor: item.vendor,
//             receiverType: item.receiverType,
//             receiver: item.receiver,
//             purpose: "Advance balance after voucher update",
//             amount: advanceAmount,
//             paymentMethod: item.paymentMethod,
//             notes: "Auto generated advance voucher"
//           });

//           await splitVoucher.save();

//           newCumulativePaidAmount += usedAmount;

//           remainingBillAmount = 0;
//         }
//       }

//       // ===============================
//       // FINAL PURCHASE CALCULATION
//       // ===============================

//       purchase.cumulativePaidAmount =
//         newCumulativePaidAmount;

//       totalAmount = purchase.grandTotal;

//       outstandingAmount =
//         totalAmount - newCumulativePaidAmount;

//       if (newCumulativePaidAmount === 0)
//         purchase.paymentStatus = "Unpaid";
//       else if (newCumulativePaidAmount < totalAmount)
//         purchase.paymentStatus = "Partial";
//       else
//         purchase.paymentStatus = "Paid";

//       await purchase.save();
//     }

//     else if (workSubcontractId) {

//       workSubcontract = await WorkSubcontract
//         .findById(workSubcontractId)
//         .populate("subcontract");

//       if (!workSubcontract) {
//         return res.status(404).json({
//           message: "WorkSubcontract not found"
//         });
//       }

//       // ===============================
//       // UPDATE CURRENT VOUCHER
//       // ===============================

//       voucher.amount = amount;

//       if (date) {
//         voucher.date = date;
//       }

//       voucher.workSubcontract = workSubcontractId;

//       voucher.purchase = null;

//       await voucher.save();

//       // ===============================
//       // DELETE OLD AUTO SPLIT VOUCHERS
//       // ===============================

//       const workVouchersForDelete = await Voucher.find({
//         workSubcontract: workSubcontractId
//       });

//       for (const item of workVouchersForDelete) {

//         await Voucher.deleteMany({
//           voucherNumber: item.voucherNumber + "-A"
//         });
//       }

//       // ===============================
//       // GET UPDATED WORK VOUCHERS
//       // ===============================

//       const workVouchers = await Voucher.find({
//         workSubcontract: workSubcontractId
//       }).sort({ createdAt: 1 });

//       let remainingBillAmount =
//         workSubcontract.grandTotal;

//       newCumulativePaidAmount = 0;

//       // ===============================
//       // RECALCULATE ALL VOUCHERS
//       // ===============================

//       for (const item of workVouchers) {

//         // Work already completed
//         if (remainingBillAmount <= 0) {

//           // Entire voucher becomes advance
//           item.workSubcontract = null;

//           await item.save();

//           continue;
//         }

//         // Voucher fully usable
//         if (item.amount <= remainingBillAmount) {

//           remainingBillAmount -= item.amount;

//           newCumulativePaidAmount += item.amount;
//         }

//         // Voucher larger than remaining amount
//         else {

//           const usedAmount = remainingBillAmount;

//           const advanceAmount =
//             item.amount - usedAmount;

//           // Update original voucher
//           item.amount = usedAmount;

//           await item.save();

//           // Create advance voucher
//           const splitVoucher = new Voucher({

//             voucherNumber:
//               item.voucherNumber + "-A",

//             subcontract: item.subcontract,

//             receiverType: item.receiverType,

//             receiver: item.receiver,

//             purpose:
//               "Advance balance after voucher update",

//             amount: advanceAmount,

//             paymentMethod: item.paymentMethod,

//             notes:
//               "Auto generated advance voucher"

//           });

//           await splitVoucher.save();

//           newCumulativePaidAmount += usedAmount;

//           remainingBillAmount = 0;
//         }
//       }

//       // ===============================
//       // FINAL WORK CALCULATION
//       // ===============================

//       workSubcontract.cumulativePaidAmount =
//         newCumulativePaidAmount;

//       totalAmount = workSubcontract.grandTotal;

//       outstandingAmount =
//         totalAmount - newCumulativePaidAmount;

//       workSubcontract.balanceAmount =
//         outstandingAmount;

//       if (newCumulativePaidAmount === 0)
//         workSubcontract.paymentStatus = "Unpaid";

//       else if (newCumulativePaidAmount < totalAmount)
//         workSubcontract.paymentStatus = "Partial";

//       else
//         workSubcontract.paymentStatus = "Paid";

//       await workSubcontract.save();
//     }

//     else {

//       // ADVANCE VOUCHER (no work subcontract attached)

//       voucher.amount = amount;

//       if (date) {
//         voucher.date = date;
//       }

//       voucher.workSubcontract = null;
//       voucher.purchase = null;

//       totalAmount = amount;
//       newCumulativePaidAmount = amount;
//       outstandingAmount = 0;

//     }

  
//     // ===============================
//     // UPDATE VOUCHER DATA FIRST
//     // ===============================

//     voucher.receiverType = receiverType || voucher.receiverType;
//     voucher.receiver = receiver || voucher.receiver;
//     voucher.purpose = purpose || voucher.purpose;
//     voucher.amount = amount || voucher.amount;
//     voucher.notes = notes || voucher.notes;
//     voucher.paymentMethod = paymentMethod || voucher.paymentMethod;

//     await voucher.save();

//     const voucherNumber = voucher.voucherNumber;

//     // ===============================
//     // CREATE TEMP PDF
//     // ===============================

//     const uploadDir = path.join(__dirname, "../../uploads");

//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     const pdfPath = path.join(uploadDir, `${voucherNumber}.pdf`);

//     const doc = new PDFDocument({ margin: 50 });

//     const stream = fs.createWriteStream(pdfPath);

//     doc.pipe(stream);

//     // ===============================
//     // HEADER
//     // ===============================

//     const startX = 50;
//     const startY = 50;

//     const logoPath = path.join(__dirname, "../assets/logo.jpeg");

//     if (fs.existsSync(logoPath)) {
//       doc.image(logoPath, startX, startY, { width: 110 });
//     }

//     const rightX = 180;

//     doc
//       .font("Helvetica-Bold")
//       .fontSize(16)
//       .text("DESIGN ART", rightX, startY);

//     doc.moveDown(0.5);

//     doc
//       .font("Helvetica")
//       .fontSize(10)
//       .text(
//         "5-6, Indria Nagar, PM Samy Colony, Ratinapuri, Gandhipuram, Coimbatore - 641012",
//         rightX,
//         doc.y,
//         { width: 350 }
//       );

//     doc.moveDown(0.3);

//     doc.text(
//       "Phone: +91 9677731326 | GST: 33BNCPP2332Q1ZT",
//       rightX,
//       doc.y,
//       { width: 350 }
//     );

//     const lineY = Math.max(doc.y + 10, startY + 100);

//     doc.moveTo(50, lineY).lineTo(550, lineY).stroke();

//     // ===============================
//     // TITLE
//     // ===============================

//     doc
//       .fontSize(18)
//       .font("Helvetica-Bold")
//       .text("PAYMENT VOUCHER", 0, lineY + 20, { align: "center" });

//     // ===============================
//     // INFO BOX
//     // ===============================

//     const boxTop = lineY + 60;

//     doc.rect(50, boxTop, 500, 120).stroke();

//     doc.fontSize(11).font("Helvetica");

//     let infoY = boxTop + 15;

//     const infoRow = (label, value) => {
//       doc.text(label, 70, infoY);
//       doc.text(value || "-", 200, infoY);
//       infoY += 20;
//     };

//     infoRow("Voucher Number:", voucherNumber);
//     infoRow("Date:", new Date(voucher.date).toLocaleDateString());
//     infoRow("Receiver Type:", voucher.receiverType);
//     infoRow("Purpose:", voucher.purpose);
//     infoRow("Payment Method:", voucher.paymentMethod);

//     // ===============================
//     // TABLE
//     // ===============================

//     const tableTop = boxTop + 150;

//     doc
//       .font("Helvetica-Bold")
//       .text("Description", 70, tableTop)
//       .text("Amount (Rs.)", 400, tableTop, { align: "right" });

//     doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

//     doc.font("Helvetica");

//     let y = tableTop + 35;

//     const row = (label, value) => {
//       doc.text(label, 70, y);
//       doc.text(`Rs. ${Number(value).toFixed(2)}`, 400, y, { align: "right" });
//       y += 25;
//     };

//     if (!purchase && !workSubcontract) {

//       // ADVANCE PAYMENT VOUCHER
//       row("Amount Paid", amount);

//     } else {

//       // NORMAL PAYMENT VOUCHER
//       row("Total Amount", totalAmount);
//       row("Amount Paid Now", amount);
//       row("Total Paid Till Now", newCumulativePaidAmount);
//       row("Outstanding Amount", outstandingAmount);

//     }

//     doc.moveTo(50, y).lineTo(550, y).stroke();

//     doc
//       .fontSize(9)
//       .text("This is a system generated voucher.", 50, y + 40, {
//         align: "center",
//         width: 500
//       });

//     doc.end();

//     // ===============================
//     // CLOUDINARY UPLOAD
//     // ===============================

//     stream.on("finish", async () => {

//       const result = await cloudinary.uploader.upload(pdfPath, {
//         resource_type: "raw",
//         folder: "vouchers",
//         public_id: voucherNumber,
//         overwrite: true
//       });

//       voucher.pdfUrl = result.secure_url;

//       await voucher.save();

//       fs.unlinkSync(pdfPath);

//       res.status(200).json({
//         message: "Voucher updated successfully",
//         voucher
//       });

//     });

//   } catch (error) {

//     res.status(500).json({
//       error: error.message
//     });

//   }
// };


// ===============================
// DELETE VOUCHER
// ===============================
// exports.deleteVoucher = async (req, res) => {

//   try {

//     const voucher = await Voucher.findById(req.params.voucherId);

//     if (!voucher) {
//       return res.status(404).json({ message: "Voucher not found" });
//     }

//     // ===============================
//     // REVERT PURCHASE PAYMENT
//     // ===============================

//     if (voucher.purchase) {

//       const purchase = await Purchase.findById(voucher.purchase);

//       purchase.cumulativePaidAmount -= voucher.amount;

//       if (purchase.cumulativePaidAmount <= 0) {
//         purchase.cumulativePaidAmount = 0;
//         purchase.paymentStatus = "Unpaid";
//       }
//       else if (purchase.cumulativePaidAmount < purchase.grandTotal) {
//         purchase.paymentStatus = "Partial";
//       }
//       else {
//         purchase.paymentStatus = "Paid";
//       }

//       await purchase.save();
//     }

//     // ===============================
//     // REVERT SUBCONTRACT PAYMENT
//     // ===============================

//     if (voucher.workSubcontract) {

//       const workSubcontract = await WorkSubcontract.findById(
//         voucher.workSubcontract
//       );

//       workSubcontract.cumulativePaidAmount -= voucher.amount;

//       if (workSubcontract.cumulativePaidAmount < 0) {
//         workSubcontract.cumulativePaidAmount = 0;
//       }

//       workSubcontract.balanceAmount =
//             workSubcontract.grandTotal -
//             workSubcontract.cumulativePaidAmount;

//       if (workSubcontract.cumulativePaidAmount === 0)
//         workSubcontract.paymentStatus = "Unpaid";
//       else if (workSubcontract.cumulativePaidAmount < workSubcontract.grandTotal)
//         workSubcontract.paymentStatus = "Partial";
//       else
//         workSubcontract.paymentStatus = "Paid";

//       await workSubcontract.save();
//     }

//     await Voucher.findByIdAndDelete(req.params.voucherId);

//     res.status(200).json({
//       message: "Voucher deleted successfully"
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }

// };


exports.deleteVoucher = async (req, res) => {

  try {

    const voucher = await Voucher.findById(req.params.voucherId);

    if (!voucher) {

      return res.status(404).json({
        message: "Voucher not found"
      });
    }

    // ===============================
    // CHECK CONNECTION
    // ===============================

    const purchaseConnected =
      voucher.appliedPurchases &&
      voucher.appliedPurchases.length > 0;

    const workSubcontractConnected =
      voucher.appliedWorkSubcontracts &&
      voucher.appliedWorkSubcontracts.length > 0;

    const isConnected =
      purchaseConnected ||
      workSubcontractConnected;

    // ===============================
    // PREVENT DELETE IF CONNECTED
    // ===============================

    if (isConnected) {

      return res.status(400).json({
        message:
          "This voucher is already connected with purchase/work subcontract. It cannot be deleted."
      });
    }

    // ===============================
    // DELETE ADVANCE VOUCHER ONLY
    // ===============================

    await voucher.deleteOne();

    res.status(200).json({
      message: "Voucher deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }

};



