const Subcontract = require("../models/Subcontract");


// ✅ CREATE Subcontract
exports.createSubcontract = async (req, res) => {
  try {

    const lastSub = await Subcontract.findOne().sort({ createdAt: -1 });

    let subcontractCode = "SC0001";

    if (lastSub && lastSub.subcontractCode) {
      const num = parseInt(lastSub.subcontractCode.substring(2), 10) + 1;
      subcontractCode = "SC" + String(num).padStart(4, "0");
    }

    const subcontract = new Subcontract({
      subcontractCode,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      companyName: req.body.companyName,
      skillType: req.body.skillType,
      gstNumber: req.body.gstNumber
    });

    const savedSubcontract = await subcontract.save();

    res.status(201).json({
      message: "Subcontract created successfully",
      data: savedSubcontract
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating subcontract",
      error: error.message
    });
  }
};


// ✅ GET ALL Subcontractors
exports.getAllSubcontracts = async (req, res) => {
  try {

    const data = await Subcontract.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: data.length,
      data
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ GET BY ID
exports.getSubcontractById = async (req, res) => {
  try {

    const data = await Subcontract.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Subcontract not found" });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ UPDATE Subcontract
exports.updateSubcontract = async (req, res) => {
  try {

    const updated = await Subcontract.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address,
        companyName: req.body.companyName,
        skillType: req.body.skillType,
        gstNumber: req.body.gstNumber
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Subcontract not found" });
    }

    res.status(200).json({
      message: "Subcontract updated successfully",
      data: updated
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ DELETE Subcontract
exports.deleteSubcontract = async (req, res) => {
  try {

    const deleted = await Subcontract.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Subcontract not found" });
    }

    res.status(200).json({
      message: "Subcontract deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};