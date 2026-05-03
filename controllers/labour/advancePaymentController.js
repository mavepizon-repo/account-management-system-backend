const AdvancePayment = require("../../models/labour/AdvancePayment");


// CREATE ADVANCE PAYMENT
exports.createAdvancePayment = async (req, res) => {
  try {

    const { labour, name, date, advanceAmount } = req.body;

    const advance = new AdvancePayment({
      labour,
      name,
      date,
      advanceAmount
    });

    await advance.save();

    res.status(201).json({
      message: "Advance payment created",
      data: advance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET ALL ADVANCES
exports.getAllAdvancePayments = async (req, res) => {
  try {

    const data = await AdvancePayment.find().populate("labour");

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET ADVANCE PAYMENT BY ID
exports.getAdvancePaymentById = async (req, res) => {
  try {

    const data = await AdvancePayment.findById(req.params.id)
      .populate("labour");

    if (!data) {
      return res.status(404).json({
        message: "Advance payment not found"
      });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET ADVANCE BY LABOUR
exports.getAdvancePaymentByLabourId = async (req, res) => {
  try {

    const data = await AdvancePayment.find({
      labour: req.params.labourId
    });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// UPDATE ADVANCE PAYMENT
exports.updateAdvance = async (req, res) => {
  try {

    const advance = await AdvancePayment.findById(req.params.id);

    if (!advance) {
      return res.status(404).json({
        message: "Advance payment not found"
      });
    }

    if (req.body.labour !== undefined) {
      advance.labour = req.body.labour;
    }

    if (req.body.name !== undefined) {
      advance.name = req.body.name;
    }

    if (req.body.date !== undefined) {
      advance.date = new Date(req.body.date);
    }

    if (req.body.advanceAmount !== undefined) {
      advance.advanceAmount = Number(req.body.advanceAmount);
    }

    if (req.body.receivedStatus !== undefined) {
      advance.receivedStatus = req.body.receivedStatus;
    }

    const updatedAdvance = await advance.save();

    res.status(200).json({
      message: "Advance payment updated successfully",
      data: updatedAdvance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// DELETE ADVANCE
exports.deleteAdvance = async (req, res) => {
  try {

    await AdvancePayment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Advance deleted"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};