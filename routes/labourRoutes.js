const express = require("express");
const router = express.Router();

const {
  createlabour,
  getlabours,
  getlabourById,
  updatelabour,
  deletelabour,
  getlabourNameAndId
} = require("../controllers/labourController");


// CREATE
router.post("/add", createlabour);

// GET ALL
router.get("/getall", getlabours);

// GET DROPDOWN
router.get("/dropdown", getlabourNameAndId);

// GET BY ID
router.get("/get/:id", getlabourById);

// UPDATE
router.put("/update/:id", updatelabour);

// DELETE
router.delete("/delete/:id", deletelabour);

module.exports = router;