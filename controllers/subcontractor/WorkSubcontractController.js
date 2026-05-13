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

    // ===============================
    // CHECK SUBCONTRACT
    // ===============================

    const subcontractExists =
      await Subcontract.findById(subcontract);

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

    // ===============================
    // DEFAULT PAYMENT VALUES
    // ===============================

    const cumulativePaidAmount = 0;

    const balanceAmount = grandTotal;

    // ===============================
    // CREATE WORK SUBCONTRACT
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

    const savedWork =
      await work.save();

    // ===============================
    // APPLY ADVANCE VOUCHERS
    // ===============================

    const advanceVouchers =
      await Voucher.find({

        subcontract: subcontract,

        remainingAmount: { $gt: 0 }

      }).sort({ createdAt: 1 });

    // Outstanding amount in work
    let remaining =
      savedWork.grandTotal;

    for (const voucher of advanceVouchers) {

      if (remaining <= 0) break;

      // usable amount from voucher
      const applyAmount = Math.min(
        voucher.remainingAmount,
        remaining
      );

      // reduce voucher balance
      voucher.remainingAmount -= applyAmount;

      // reduce work balance
      remaining -= applyAmount;

      // store work mapping
      voucher.appliedWorkSubcontracts.push({

        workSubcontract: savedWork._id,

        usedAmount: applyAmount

      });

      await voucher.save();

    }

    // ===============================
    // UPDATE WORK PAID AMOUNT
    // ===============================

    const paidAmount =
      savedWork.grandTotal - remaining;

    savedWork.cumulativePaidAmount =
      paidAmount;

    savedWork.balanceAmount =
      remaining;

    // ===============================
    // UPDATE PAYMENT STATUS
    // ===============================

    if (paidAmount === 0) {

      savedWork.paymentStatus =
        "Unpaid";

    }

    else if (
      paidAmount <
      savedWork.grandTotal
    ) {

      savedWork.paymentStatus =
        "Partial";

    }

    else {

      savedWork.paymentStatus =
        "Paid";

    }

    await savedWork.save();

    res.status(201).json({

      message:
        "Work Created Successfully",

      data: savedWork

    });

  }

  catch (error) {

    res.status(500).json({

      message:
        "Error creating work",

      error: error.message

    });

  }

};


exports.getAllWorks = async (req, res) => {

  try {

    const works = await WorkSubcontract.find()
      .populate(
        "subcontract",
        "subcontractCode name phone"
      );

    res.status(200).json({

      count: works.length,

      data: works

    });

  }

  catch (error) {

    res.status(500).json({

      error: error.message

    });

  }

};

// get work details by workId
exports.getWorkById = async (req, res) => {

  try {

    const work = await WorkSubcontract
      .findById(req.params.workId)
      .populate(
        "subcontract",
        "subcontractCode name phone"
      );

    if (!work) {

      return res.status(404).json({
        message: "Work not found"
      });

    }

    res.status(200).json({

      data: work

    });

  }

  catch (error) {

    res.status(500).json({

      error: error.message

    });

  }

};


// get work details by subcontractID
exports.getWorksBySubcontract = async (req, res) => {

  try {

    const works = await WorkSubcontract.find({

      subcontract: req.params.subcontractId

    }).populate(

      "subcontract",
      "subcontractCode name"

    );

    res.status(200).json({

      count: works.length,

      data: works

    });

  }

  catch (error) {

    res.status(500).json({

      error: error.message

    });

  }

};


exports.updateWork = async (req, res) => {

  try {

    const {

      projectName,

      description,

      startDate,

      endDate,

      status

    } = req.body;

    const updatedWork =
      await WorkSubcontract.findByIdAndUpdate(

        req.params.workId,

        {

          projectName,

          description,

          startDate,

          endDate,

          status

        },

        {

          new: true

        }

      ).populate(

        "subcontract",

        "subcontractCode name phone"

      );

    if (!updatedWork) {

      return res.status(404).json({

        message: "Work not found"

      });

    }

    res.status(200).json({

      message: "Work Updated Successfully",

      data: updatedWork

    });

  }

  catch (error) {

    res.status(500).json({

      error: error.message

    });

  }

};

exports.deleteWork = async (req, res) => {

  try {

    const work = await WorkSubcontract.findById(
      req.params.workId
    );

    if (!work) {

      return res.status(404).json({
        message: "Work not found"
      });

    }

    // ===============================
    // PREVENT DELETE IF PAYMENT EXISTS
    // ===============================

    if (work.cumulativePaidAmount > 0) {

      return res.status(400).json({
        message:
          "Cannot delete work with existing payments"
      });

    }

    // ===============================
    // UNLINK VOUCHERS
    // ===============================

    await Voucher.updateMany(

      {
        "appliedWorkSubcontracts.workSubcontract":
          req.params.workId
      },

      {
        $pull: {
          appliedWorkSubcontracts: {
            workSubcontract:
              req.params.workId
          }
        }
      }

    );

    // ===============================
    // DELETE WORK
    // ===============================

    await WorkSubcontract.findByIdAndDelete(
      req.params.workId
    );

    res.status(200).json({

      message:
        "Work Deleted Successfully"

    });

  }

  catch (error) {

    res.status(500).json({

      message:
        "Error deleting work",

      error: error.message

    });

  }

};

