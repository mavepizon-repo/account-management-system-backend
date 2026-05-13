const express = require("express");
const router = express.Router();
const labourVoucherController = require("../../controllers/labour/labourVoucherController");



router.post("/create", labourVoucherController.createLabourVoucher);
router.get("/calculate", labourVoucherController.getLabourVoucherCalculation);


router.get("/getall", labourVoucherController.getAllVouchers);

router.get("/get/:id", labourVoucherController.getVoucherById);

router.delete("/delete/:id", labourVoucherController.deleteVoucher);

router.get("/get-by-labourId/:labourId", labourVoucherController.getVouchersByLabourId);

module.exports = router;