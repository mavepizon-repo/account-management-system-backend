const express = require("express");
const router = express.Router();
const invoiceController = require("../../controllers/client/invoiceController");


router.post("/create", invoiceController.createInvoice);

router.get("/getall", invoiceController.getAllInvoices);

router.get(
  "/get-invoice-by-invoiceId/:invoiceId",
  invoiceController.getInvoiceByInvoiceId
);

router.get(
  "/get-invoice-by-clientId/:clientId",
  invoiceController.getInvoicesByClientId
);

router.get(
  "/get-invoice-by-paymentstatus/:paymentStatus",
  invoiceController.getInvoicesByStatus
);

router.get(
  "/get-by-client-and-status/:clientId/:paymentStatus",
  invoiceController.getInvoicesByClientAndStatus
);

router.put(
  "/update/:invoiceId",
  invoiceController.updateInvoiceByInvoiceId
);

router.put(
  "/update-products/:invoiceId", invoiceController.updateInvoiceProducts
);

router.delete(
  "/delete/:invoiceId",
  invoiceController.deleteInvoice
);

module.exports = router;