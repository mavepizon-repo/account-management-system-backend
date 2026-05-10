const express = require("express");

const router = express.Router();

const clientController = require("../../controllers/client/clientController");


router.post("/create", clientController.createClient);

router.get("/getall", clientController.getClients);

router.get("/get/:id", clientController.getClientById);

router.put("/edit/:id", clientController.updateClient);

router.delete("/delete/:id", clientController.deleteClient);

router.get("/getByClientnameAndID", clientController.getClientNameAndCode);

router.get("/getAdvanceAmount/:clientId", clientController.getClientAdvance);


module.exports = router;