const Labour = require("../models/Labour");


// CREATE labour
exports.createlabour = async (req, res) => {
  try {

    const lastLabour = await Labour.findOne().sort({ createdAt: -1 });

    let labourId = "LB001";

    if (lastLabour && lastLabour.labourId) {
      const num = parseInt(lastLabour.labourId.substring(2)) + 1;
      labourId = "LB" + String(num).padStart(3, "0");
    }

    // ✅ Now use it AFTER declaration
    const labour = new Labour({
      labourId: labourId,
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      workType: req.body.workType,
      dailyWage: req.body.dailyWage,
      description: req.body.description
    });

    const savedLabour = await labour.save();

    res.status(201).json(savedLabour);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// GET ALL labourS
exports.getlabours = async (req, res) => {
  try {

    const labours = await Labour.find();

    res.json(labours);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// GET labour BY ID
exports.getlabourById = async (req, res) => {
  try {

    const labour = await Labour.findById(req.params.id);

    if (!labour) {
      return res.status(404).json({ message: "labour not found" });
    }

    res.json(labour);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// UPDATE labour
exports.updatelabour = async (req, res) => {
  try {

    const updatedlabour = await Labour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedlabour) {
      return res.status(404).json({ message: "labour not found" });
    }

    res.json(updatedlabour);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// DELETE labour
exports.deletelabour = async (req, res) => {
  try {

    const labour = await Labour.findByIdAndDelete(req.params.id);

    if (!labour) {
      return res.status(404).json({ message: "labour not found" });
    }

    res.json({ message: "labour deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// GET labour FOR DROPDOWN
exports.getlabourNameAndId = async (req, res) => {
  try {

    const labours = await Labour.find()
      .select("labourId name");

    res.status(200).json({
      count: labours.length,
      data: labours
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};