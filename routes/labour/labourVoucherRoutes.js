const express = require("express");
const router = express.Router();
const labourVoucherController = require("../../controllers/labour/labourVoucherController");

router.post("/create", labourVoucherController.createVoucher);

router.get("/getall", labourVoucherController.getAllVouchers);

router.get("/get/:id", labourVoucherController.getVoucherById);

router.put("/update/:id", labourVoucherController.updateVoucher);

router.delete("/delete/:id", labourVoucherController.deleteVoucher);

router.get("/get-by-labourId/:labourId", labourVoucherController.getVouchersByLabourId);

module.exports = router;