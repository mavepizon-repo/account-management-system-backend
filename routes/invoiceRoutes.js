const express = require("express");
const router = express.Router();

const invoiceController = require("../controllers/invoiceController");

router.post("/create", invoiceController.createInvoice);
router.get("/getall", invoiceController.getAllInvoices);
router.get("/get-invoice-by-invoiceId/:invoiceId", invoiceController.getInvoiceByInvoiceId);
router.get("/get-invoice-by-clientId/:clientId", invoiceController.getInvoicesByClientId);
router.get("/get-invoice-by-paymentstatus/:paymentStatus", invoiceController.getInvoicesByStatus);
router.get(
  "/get-invoice-by-client-and-status/:clientId/:paymentStatus",
  invoiceController.getInvoicesByClientAndStatus
);
router.put("/update/:id", invoiceController.updateInvoice);
router.delete("/delete/:id", invoiceController.deleteInvoice);


module.exports = router;