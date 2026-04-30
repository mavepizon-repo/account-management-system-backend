const express = require("express");
const router = express.Router();

const receiptController = require("../controllers/receiptController");

// CREATE RECEIPT + GENERATE PDF
router.post("/create", receiptController.createReceipt);

// GET ALL RECEIPTS
router.get("/getall", receiptController.getAllReceipts);

// GET RECEIPTS BY INVOICE ID
router.get("/get-by-invoice/:invoiceId", receiptController.getReceiptsByInvoiceId);

// GET RECEIPTS BY CLIENT ID
router.get("/get-by-client/:clientId", receiptController.getReceiptsByClientId);

// GET RECEIPT BY Receipt ID
router.get("/get/:id", receiptController.getReceiptById);

router.put("/update/:id", receiptController.updateReceipt);

// DELETE RECEIPT
router.delete("/delete/:id", receiptController.deleteReceipt);

module.exports = router;