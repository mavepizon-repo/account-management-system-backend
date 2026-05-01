const express = require("express");
const router = express.Router();

const voucherController = require("../controllers/voucherController");


// CREATE VOUCHER
router.post("/create", voucherController.createVoucher);


// GET ALL VOUCHERS
router.get("/getall", voucherController.getAllVouchers);


// GET VOUCHER BY ID
router.get("/get/:voucherId", voucherController.getVoucherById);


// GET VOUCHERS BY PURCHASE ID
router.get("/get-by-purchase/:purchaseId", voucherController.getVouchersByPurchaseId);

// GET VOUCHERS BY SUBCONTRACT ID
router.get("/get-by-worksubcontract/:workSubcontractId", voucherController.getVouchersByWorkSubcontractId);

// UPDATE VOUCHER
router.put("/update/:voucherId", voucherController.updateVoucher);

// DELETE VOUCHER
router.delete("/delete/:voucherId", voucherController.deleteVoucher);


module.exports = router;