const Client = require("../models/Client");


// CREATE CLIENT
exports.createClient = async (req, res) => {
  try {

    const lastClient = await Client.findOne().sort({ createdAt: -1 });

    let clientCode = "CL001";

    if (lastClient && lastClient.clientCode) {
      const num = parseInt(lastClient.clientCode.substring(2)) + 1;
      clientCode = "CL" + String(num).padStart(3, "0");
    }

    const client = new Client({
      clientCode,
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    });

    const savedClient = await client.save();

    res.status(201).json(savedClient);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL CLIENTS
exports.getClients = async (req, res) => {
  try {

    const clients = await Client.find();

    res.json(clients);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET CLIENT BY ID
exports.getClientById = async (req, res) => {
  try {

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE CLIENT
exports.updateClient = async (req, res) => {
  try {

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedClient);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE CLIENT
exports.deleteClient = async (req, res) => {
  try {

    await Client.findByIdAndDelete(req.params.id);

    res.json({ message: "Client deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};