const express = require("express");
const router = express.Router();

const voucherController = require("../controllers/voucherController");


// ===== CREATE VOUCHER =====
router.post("/create", voucherController.createVoucher);


// ===== GET ALL VOUCHERS =====
router.get("/getall", voucherController.getAllVouchers);


// ===== GET VOUCHER BY ID =====
router.get("/get/:id", voucherController.getVoucherById);


// ===== UPDATE VOUCHER =====
router.get("/:id", voucherController.getVoucherById);


// ===== DELETE VOUCHER =====
router.delete("/delete/:id", voucherController.deleteVoucher);

module.exports = router;