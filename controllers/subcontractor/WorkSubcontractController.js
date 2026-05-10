const WorkSubcontract = require("../../models/subcontractor/WorkSubcontract");
const Voucher = require("../../models/vendor/Voucher");
const Subcontract = require("../../models/subcontractor/Subcontract");



exports.createWork = async (req, res) => {
  try {

    const {
      subcontract,
      projectName,
      description,
      startDate,
      endDate,
      totalAmount,
      gstPercent = 0
    } = req.body;

    // CHECK SUBCONTRACT
    const subcontractExists = await Subcontract.findById(subcontract);

    if (!subcontractExists) {
      return res.status(404).json({
        message: "Subcontract not found"
      });
    }

    // ===============================
    // GST CALCULATION
    // ===============================

    const gstAmount =
      (Number(totalAmount) * Number(gstPercent)) / 100;

    const grandTotal =
      Number(totalAmount) + gstAmount;

    const cumulativePaidAmount = 0;

    const balanceAmount = grandTotal;

    // ===============================
    // CREATE WORK
    // ===============================

    const work = new WorkSubcontract({
      subcontract,
      projectName,
      description,
      startDate,
      endDate,

      totalAmount,
      gstPercent,
      gstAmount,
      grandTotal,

      cumulativePaidAmount,
      balanceAmount,
      paymentStatus: "Unpaid"
    });

    const savedWork = await work.save();

    // ===============================
    // APPLY ADVANCE VOUCHERS
    // ===============================

    let outstandingAmount =
      savedWork.grandTotal;

    const advanceVouchers = await Voucher.find({
      subcontract,
      workSubcontract: null
    }).sort({ createdAt: 1 });

    for (const voucher of advanceVouchers) {

      if (outstandingAmount <= 0) break;

      // FULL VOUCHER USE
      if (voucher.amount <= outstandingAmount) {

        voucher.workSubcontract = savedWork._id;

        await voucher.save();

        outstandingAmount -= voucher.amount;
      }

      // SPLIT VOUCHER
      else {

        const usedAmount = outstandingAmount;

        const remainingVoucherAmount =
          voucher.amount - usedAmount;

        voucher.amount = usedAmount;

        voucher.workSubcontract = savedWork._id;

        await voucher.save();

        // CREATE NEW ADVANCE VOUCHER
        const newVoucher = new Voucher({
          voucherNumber: voucher.voucherNumber + "-A",

          subcontract: voucher.subcontract,

          receiverType: voucher.receiverType,
          receiver: voucher.receiver,

          purpose: voucher.purpose,

          amount: remainingVoucherAmount,

          paymentMethod: voucher.paymentMethod,

          workSubcontract: null,

          notes: "Advance balance from voucher split"
        });

        await newVoucher.save();

        outstandingAmount = 0;
      }
    }

    // ===============================
    // UPDATE PAYMENT STATUS
    // ===============================

    savedWork.cumulativePaidAmount =
      savedWork.grandTotal - outstandingAmount;

    savedWork.balanceAmount = outstandingAmount;

    if (savedWork.cumulativePaidAmount === 0)
      savedWork.paymentStatus = "Unpaid";

    else if (
      savedWork.cumulativePaidAmount <
      savedWork.grandTotal
    )
      savedWork.paymentStatus = "Partial";

    else
      savedWork.paymentStatus = "Paid";

    await savedWork.save();

    res.status(201).json({
      message: "Work Created Successfully",
      data: savedWork
    });

  } catch (error) {

    res.status(500).json({
      message: "Error creating work",
      error: error.message
    });

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

    const {
      projectName,
      description,
      startDate,
      endDate,
      status,
      totalAmount,
      gstPercent
    } = req.body;

    const work = await WorkSubcontract.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        message: "Work not found"
      });
    }

    if (projectName) work.projectName = projectName;

    if (description) work.description = description;

    if (startDate) work.startDate = startDate;

    if (endDate) work.endDate = endDate;

    if (status) work.status = status;

    if (totalAmount !== undefined)
      work.totalAmount = Number(totalAmount);

    if (gstPercent !== undefined)
      work.gstPercent = Number(gstPercent);

    // ===============================
    // RECALCULATE GST
    // ===============================

    work.gstAmount =
      (work.totalAmount * work.gstPercent) / 100;

    work.grandTotal =
      work.totalAmount + work.gstAmount;

    // ===============================
    // BALANCE
    // ===============================

    work.balanceAmount =
      work.grandTotal - work.cumulativePaidAmount;

    // ===============================
    // PAYMENT STATUS
    // ===============================

    if (work.cumulativePaidAmount === 0)
      work.paymentStatus = "Unpaid";

    else if (
      work.cumulativePaidAmount <
      work.grandTotal
    )
      work.paymentStatus = "Partial";

    else
      work.paymentStatus = "Paid";

    await work.save();

    res.status(200).json({
      message: "Work Updated Successfully",
      data: work
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

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

    // ===============================
    // REVERT VOUCHERS TO ADVANCE
    // ===============================

    const vouchers = await Voucher.find({workSubcontract: work._id});

    for (const voucher of vouchers) {
      voucher.workSubcontract = null;
      await voucher.save();
    }

    // ===============================
    // DELETE WORK
    // ===============================

    await WorkSubcontract.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Work Deleted Successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

