const Labour = require("../models/Labour");


// ===== CREATE LABOUR =====
exports.createLabour = async (req, res) => {
  try {
    const {
      name,
      workType,
      site,
      dailyWage,
      daysWorked = 0,
      advance = 0
    } = req.body;

    if (!name || !dailyWage) {
      return res.status(400).json({
        message: "Name and Daily Wage are required"
      });
    }

    // Generate Labour ID
    const last = await Labour.findOne().sort({ createdAt: -1 });

    let labourId = "LB001";

    if (last && last.labourId) {
      const num = parseInt(last.labourId.substring(2)) + 1;
      labourId = "LB" + String(num).padStart(3, "0");
    }

    // Calculation
    const totalSalary = dailyWage * daysWorked;
    const balance = totalSalary - advance;

    const labour = new Labour({
      labourId,
      name,
      workType,
      site,
      dailyWage,
      daysWorked,
      advance,
      totalSalary,
      balance
    });

    const saved = await labour.save();

    res.status(201).json({
      message: "Labour created",
      labour: saved
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ===== GET ALL =====
exports.getAllLabours = async (req, res) => {
  try {
    const labours = await Labour.find();

    res.json({
      count: labours.length,
      data: labours
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ===== GET BY ID =====
exports.getLabourById = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);

    if (!labour) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(labour);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ===== UPDATE =====
exports.updateLabour = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);

    if (!labour) {
      return res.status(404).json({ message: "Not found" });
    }

    // update fields
    Object.assign(labour, req.body);

    // recalculate
    labour.totalSalary = labour.dailyWage * labour.daysWorked;
    labour.balance = labour.totalSalary - labour.advance;

    const updated = await labour.save();

    res.json({
      message: "Updated successfully",
      labour: updated
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ===== DELETE =====
exports.deleteLabour = async (req, res) => {
  try {
    await Labour.findByIdAndDelete(req.params.id);

    res.json({
      message: "Deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};