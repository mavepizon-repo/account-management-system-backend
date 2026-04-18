const express = require("express");
const router = express.Router();

const invoiceController = require("../controllers/invoiceController");

router.post("/create", invoiceController.createInvoice);
router.get("/getall", invoiceController.getAllInvoices);
router.get("get/:id", invoiceController.getInvoiceById);
router.put("/update/:id", invoiceController.updateInvoice);
router.delete("/delete/:id", invoiceController.deleteInvoice);

module.exports = router;