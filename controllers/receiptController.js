// const cloudinary = require("../config/cloudinary");
// const Invoice = require("../models/Invoice");
// const Client = require("../models/Client");
// const Receipt = require("../models/Receipt");
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");


// exports.createReceipt = async (req, res) => {
//   try {
//     const { invoiceId, amountPaid } = req.body;

//     if (!amountPaid || amountPaid <= 0) {
//       return res.status(400).json({
//         message: "Amount must be greater than 0"
//       });
//     }

//     const invoice = await Invoice.findById(invoiceId).populate("client");

//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // 🧮 Remaining balance calculation
//     const remainingAmount = invoice.grandTotal - invoice.paidAmount;

//     // ❌ Prevent overpayment
//     if (amountPaid > remainingAmount) {
//       return res.status(400).json({
//         message: "Payment exceeds remaining balance",
//         remainingAmount
//       });
//     }

//     // ✅ Update paid amount safely
//     const newPaidAmount = invoice.paidAmount + amountPaid;

//     let paymentStatus = "Unpaid";

//     if (newPaidAmount > 0 && newPaidAmount < invoice.grandTotal) {
//       paymentStatus = "Partial";
//     } else if (newPaidAmount === invoice.grandTotal) {
//       paymentStatus = "Paid";
//     }

//     invoice.paidAmount = newPaidAmount;
//     invoice.paymentStatus = paymentStatus;

//     await invoice.save();

//     // 🧾 Receipt number
//     const lastReceipt = await Receipt.findOne().sort({ createdAt: -1 });

//     let receiptNumber = "RC0001";

//     if (lastReceipt && lastReceipt.receiptNumber) {
//       const num = parseInt(lastReceipt.receiptNumber.substring(2)) + 1;
//       receiptNumber = "RC" + String(num).padStart(4, "0");
//     }

//     // 📄 PDF generation
//     const pdfPath = path.join(__dirname, `../${receiptNumber}.pdf`);
//     const doc = new PDFDocument();
//     const stream = fs.createWriteStream(pdfPath);

//     doc.pipe(stream);

//     doc.fontSize(20).text("Payment Receipt", { align: "center" });
//     doc.moveDown();

//     doc.text(`Receipt No: ${receiptNumber}`);
//     doc.text(`Client: ${invoice.client.name}`);
//     doc.text(`Project: ${invoice.project}`);
//     doc.text(`Paid Amount: ${amountPaid}`);
//     doc.text(`Total Paid: ${newPaidAmount}`);
//     doc.text(`Invoice Total: ${invoice.grandTotal}`);
//     doc.text(`Remaining Balance: ${invoice.grandTotal - newPaidAmount}`);

//     doc.end();

//     // ⏳ Wait for PDF to finish writing properly (NO setTimeout)
//     stream.on("finish", async () => {
//       try {
//         const result = await cloudinary.uploader.upload(pdfPath, {
//           resource_type: "raw",
//           folder: "receipts",
//           type: "upload" // 👈 IMPORTANT (forces public access)
//         });
//         const receipt = new Receipt({
//           invoice: invoice._id,
//           client: invoice.client._id,
//           amountPaid,
//           receiptNumber,
//           receiptPdf: result.secure_url
//         });

//         const savedReceipt = await receipt.save();

//         fs.unlinkSync(pdfPath);

//         return res.status(201).json({
//           message: "Receipt generated successfully",
//           receipt: savedReceipt,
//           updatedInvoice: invoice
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


// exports.getAllReceipts = async (req, res) => {
//   try {

//     const receipts = await Receipt.find()
//       .populate("client", "name clientCode")
//       .populate("invoice", "project grandTotal paidAmount paymentStatus");

//     res.status(200).json({
//       count: receipts.length,
//       receipts
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



// exports.getReceiptsByInvoiceId = async (req, res) => {
//   try {

//     const receipts = await Receipt.find({ invoice: req.params.invoiceId })
//       .populate("client", "name clientCode")
//       .populate("invoice", "project grandTotal");

//     if (receipts.length === 0) {
//       return res.status(404).json({
//         message: "No receipts found for this invoice"
//       });
//     }

//     res.status(200).json(receipts);

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.getReceiptsByClientId = async (req, res) => {
//   try {

//     const receipts = await Receipt.find({ client: req.params.clientId })
//       .populate("client", "name clientCode")
//       .populate("invoice", "project grandTotal");

//     if (receipts.length === 0) {
//       return res.status(404).json({
//         message: "No receipts found for this client"
//       });
//     }

//     res.status(200).json(receipts);

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.getReceiptById = async (req, res) => {
//   try {

//     const receipt = await Receipt.findById(req.params.id)
//       .populate("client", "name clientCode")
//       .populate("invoice", "project grandTotal paidAmount");

//     if (!receipt) {
//       return res.status(404).json({
//         message: "Receipt not found"
//       });
//     }

//     res.status(200).json(receipt);

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.updateReceipt = async (req, res) => {
//   try {
//     const receipt = await Receipt.findById(req.params.id);

//     if (!receipt) {
//       return res.status(404).json({ message: "Receipt not found" });
//     }

//     if (req.body.amountPaid !== undefined) {
//       receipt.amountPaid = Number(req.body.amountPaid);
//     }

//     if (req.body.paymentDate !== undefined) {
//       receipt.paymentDate = new Date(req.body.paymentDate);
//     }

//     const updatedReceipt = await receipt.save();

//     res.status(200).json({
//       message: "Receipt updated successfully",
//       receipt: updatedReceipt
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



// exports.deleteReceipt = async (req, res) => {
//   try {

//     const receipt = await Receipt.findById(req.params.id);

//     if (!receipt) {
//       return res.status(404).json({
//         message: "Receipt not found"
//       });
//     }

//     await receipt.deleteOne();

//     res.status(200).json({
//       message: "Receipt deleted successfully"
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

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

    const remainingAmount = invoice.grandTotal - invoice.paidAmount;

    if (amountPaid > remainingAmount) {
      return res.status(400).json({
        message: "Payment exceeds remaining balance",
        remainingAmount
      });
    }

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

    const lastReceipt = await Receipt.findOne().sort({ createdAt: -1 });

    let receiptNumber = "RC0001";

    if (lastReceipt && lastReceipt.receiptNumber) {
      const num = parseInt(lastReceipt.receiptNumber.substring(2)) + 1;
      receiptNumber = "RC" + String(num).padStart(4, "0");
    }

    // ===== PDF GENERATION =====

    const pdfPath = path.join(__dirname, `../${receiptNumber}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // ===== HEADER =====

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("DESIGN ART", { align: "center" });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text("(Interior and Exterior Solution)", { align: "center" });

    doc
      .fontSize(10)
      .text("Accounts Master Ledger", { align: "center" });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(2);

    // ===== RECEIPT TITLE =====

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("PAYMENT RECEIPT", { align: "center" });

    doc.moveDown(2);

    doc.fontSize(11).font("Helvetica");

    const labelX = 50;
    const valueX = 200;

    doc.text("Receipt Number :", labelX, doc.y);
    doc.text(receiptNumber, valueX, doc.y - 14);

    doc.moveDown();

    doc.text("Date :", labelX, doc.y);
    doc.text(new Date().toLocaleDateString(), valueX, doc.y - 14);

    doc.moveDown();

    doc.text("Client Name :", labelX, doc.y);
    doc.text(invoice.client.name, valueX, doc.y - 14);

    doc.moveDown();

    doc.text("Project :", labelX, doc.y);
    doc.text(invoice.project, valueX, doc.y - 14);

    doc.moveDown(2);

    // ===== TABLE HEADER =====

    const tableTop = doc.y;

    doc
      .font("Helvetica-Bold")
      .text("Description", 50, tableTop)
      .text("Amount (Rs.)", 450, tableTop, { align: "right" });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.font("Helvetica");

    // ===== TABLE ROW FUNCTION =====

    const row = (y, text, amount) => {
      doc.text(text, 50, y);
      doc.text(`Rs. ${Number(amount).toFixed(2)}`, 450, y, { align: "right" });
    };

    let rowY = doc.y + 10;

    row(rowY, "Invoice Total", invoice.grandTotal);

    rowY += 25;
    row(rowY, "Amount Paid", amountPaid);

    rowY += 25;
    row(rowY, "Total Paid Till Now", newPaidAmount);

    rowY += 25;
    row(rowY, "Remaining Balance", invoice.grandTotal - newPaidAmount);

    doc.moveDown(5);

   // ===== FOOTER MESSAGE =====

    doc.moveDown(3);

    // reset cursor to left margin
    doc.x = 50;

    doc
      .fontSize(11)
      .text("Thank you for your payment!", 50, doc.y, {
        align: "center",
        width: 500
      });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .text("This is a system generated receipt.", 50, doc.y, {
        align: "center",
        width: 500
      });

    doc.end();

    // ===== UPLOAD TO CLOUDINARY =====

    stream.on("finish", async () => {
      try {

        const result = await cloudinary.uploader.upload(pdfPath, {
          resource_type: "raw",
          folder: "receipts",
          type: "upload"
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



// ===== GET ALL RECEIPTS =====

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



// ===== GET RECEIPTS BY INVOICE =====

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



// ===== GET RECEIPTS BY CLIENT =====

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



// ===== GET RECEIPT BY ID =====

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



// ===== DELETE RECEIPT =====

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

