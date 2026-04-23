// const express = require("express");
// const router = express.Router();

// const subcontractController = require("../controllers/subcontractController");

// router.post("/create", subcontractController.createSubcontract);
// router.get("/getall", subcontractController.getAllSubcontracts);
// router.get("/get/:id", subcontractController.getSubcontractById);
// router.put("/update/:id", subcontractController.updateSubcontract);
// router.delete("/delete/:id", subcontractController.deleteSubcontract);

// module.exports = router;
const express = require("express");
const router = express.Router();

const subcontractController = require("../controllers/subcontractController");

router.post("/create", subcontractController.createSubcontract);
router.get("/getall", subcontractController.getAllSubcontracts);
router.get("/get/:id", subcontractController.getSubcontractById);
router.put("/update/:id", subcontractController.updateSubcontract);
router.delete("/delete/:id", subcontractController.deleteSubcontract);

module.exports = router;