const express = require("express");
const router = express.Router();

const labourController = require("../controllers/labourController");

// CREATE
router.post("/add", labourController.createLabour);

// GET ALL
router.get("/getall", labourController.getAllLabours);

// GET BY ID
router.get("/get/:id", labourController.getLabourById);

// UPDATE
router.put("/edit/:id", labourController.updateLabour);

// DELETE
router.delete("/delete/:id", labourController.deleteLabour);

module.exports = router;