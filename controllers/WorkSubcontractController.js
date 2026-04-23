const WorkSubcontract = require("../models/WorkSubcontract");

exports.createWork = async (req, res) => {
  try {

    const {
      subcontract,
      projectName,
      description,
      startDate,
      endDate,
      totalAmount,
      paidAmount = 0
    } = req.body;

    const balanceAmount = totalAmount - paidAmount;

    let paymentStatus = "Unpaid";

    if (paidAmount > 0 && paidAmount < totalAmount) {
      paymentStatus = "Partial";
    } 
    else if (paidAmount >= totalAmount) {
      paymentStatus = "Paid";
    }

    const work = new WorkSubcontract({
      subcontract,
      projectName,
      description,
      startDate,
      endDate,
      totalAmount,
      paidAmount,
      balanceAmount,
      paymentStatus
    });

    const savedWork = await work.save();

    res.status(201).json({
      message: "Work created successfully",
      data: savedWork
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getAllWorks = async (req, res) => {
  try {

    const works = await WorkSubcontract.find()
      .populate("subcontract", "subcontractCode name phone");

    res.status(200).json({
      count: works.length,
      works
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get work details by workId
exports.getWorkById = async (req, res) => {
  try {

    const work = await WorkSubcontract.findById(req.params.workId)
      .populate("subcontract", "subcontractCode name phone");

    if (!work) {
      return res.status(404).json({
        message: "Work not found"
      });
    }

    res.status(200).json(work);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// get work details by subcontractID
exports.getWorksBySubcontract = async (req, res) => {
  try {

    const works = await WorkSubcontract.find({
      subcontract: req.params.subcontractId
    }).populate("subcontract", "subcontractCode name");

    res.status(200).json({
      count: works.length,
      works
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateWork = async (req, res) => {
  try {

    const work = await WorkSubcontract.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        message: "Work not found"
      });
    }

    if (req.body.projectName) work.projectName = req.body.projectName;
    if (req.body.description) work.description = req.body.description;
    if (req.body.startDate) work.startDate = req.body.startDate;
    if (req.body.endDate) work.endDate = req.body.endDate;
    if (req.body.status) work.status = req.body.status;

    if (req.body.totalAmount !== undefined) {
      work.totalAmount = Number(req.body.totalAmount);
    }

    if (req.body.paidAmount !== undefined) {
      work.paidAmount = Number(req.body.paidAmount);
    }

    work.balanceAmount = work.totalAmount - work.paidAmount;

    if (work.paidAmount === 0) {
      work.paymentStatus = "Unpaid";
    } 
    else if (work.paidAmount < work.totalAmount) {
      work.paymentStatus = "Partial";
    } 
    else {
      work.paymentStatus = "Paid";
    }

    const updatedWork = await work.save();

    res.status(200).json({
      message: "Work updated successfully",
      data: updatedWork
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.deleteWork = async (req, res) => {
  try {

    const work = await WorkSubcontract.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        message: "Work not found"
      });
    }

    await work.deleteOne();

    res.status(200).json({
      message: "Work deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};