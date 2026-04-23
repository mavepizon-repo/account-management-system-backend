const express = require("express");
const router = express.Router();
const workController = require("../controllers/workSubcontractController");

router.post("/create", workController.createWork);
router.get("/getall", workController.getAllWorks);
router.get("/get/:workId", workController.getWorkById);
router.get("/subcontract/:subcontractId", workController.getWorksBySubcontract);
router.put("/update/:id", workController.updateWork);
router.delete("/delete/:id", workController.deleteWork);

module.exports = router;