const express = require("express");
const router = express.Router();

const advanceController = require("../../controllers/labour/advancePaymentController");


// CREATE ADVANCE PAYMENT
router.post("/create", advanceController.createAdvancePayment);


// GET ALL ADVANCES
router.get("/getall", advanceController.getAllAdvancePayments);


// GET ADVANCE BY ID
router.get("/get/:id", advanceController.getAdvancePaymentById);


// GET ADVANCES BY LABOUR ID
router.get("/get-by-labour/:labourId", advanceController.getAdvancePaymentByLabourId);


// UPDATE ADVANCE PAYMENT
router.put("/update/:id", advanceController.updateAdvance);


// DELETE ADVANCE PAYMENT
router.delete("/delete/:id", advanceController.deleteAdvance);


module.exports = router;