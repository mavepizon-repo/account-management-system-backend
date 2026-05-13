const AdvancePayment = require("../../models/labour/AdvancePayment");


// =======================================
// CREATE ADVANCE PAYMENT
// =======================================
exports.createAdvancePayment = async (req, res) => {
  try {

    const {
      labour,
      date,
      advanceAmount,

      deductionType,

      installmentMonths,
      fixedDeductionAmount
    } = req.body;

    // =======================================
    // BASIC VALIDATION
    // =======================================

    if (
      !labour ||
      !date ||
      !advanceAmount ||
      !deductionType
    ) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    // =======================================
    // VALIDATE DEDUCTION TYPE
    // =======================================

    const allowedTypes = [
      "Monthly Installment",
      "Fixed Amount",
      "Custom"
    ];

    if (!allowedTypes.includes(deductionType)) {
      return res.status(400).json({
        message: "Invalid deduction type"
      });
    }

    // =======================================
    // MONTHLY INSTALLMENT
    // =======================================

    let finalInstallmentMonths = null;
    let finalFixedDeductionAmount = null;

    if (deductionType === "Monthly Installment") {

      if (
        !installmentMonths ||
        Number(installmentMonths) <= 0
      ) {
        return res.status(400).json({
          message: "Installment months required"
        });
      }

      finalInstallmentMonths =
        Number(installmentMonths);
    }

    // =======================================
    // FIXED AMOUNT
    // =======================================

    

    else if (deductionType === "Fixed Amount") {

      if (
        fixedDeductionAmount === undefined ||
        Number(fixedDeductionAmount) <= 0
      ) {
        return res.status(400).json({
          message:
            "Fixed deduction amount required"
        });
      }

      finalFixedDeductionAmount =
        Number(fixedDeductionAmount);
    }

    // =======================================
    // CUSTOM
    // =======================================

    else if (deductionType === "Custom") {

      // remove unused fields
      finalInstallmentMonths = null;
      finalFixedDeductionAmount = null;
    }

    // =======================================
    // CREATE ADVANCE
    // =======================================

    const advance = new AdvancePayment({

      labour,
      date,

      advanceAmount:
        Number(advanceAmount),

      deductionType,

      installmentMonths:
        finalInstallmentMonths,

      fixedDeductionAmount:
        finalFixedDeductionAmount,

      deductedAmount: 0,

      remainingAmount:
        Number(advanceAmount),

      status: "Pending"
    });

    await advance.save();

    res.status(201).json({
      message:
        "Advance payment created successfully",
      data: advance
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



// =======================================
// GET ALL ADVANCES
// =======================================
exports.getAllAdvancePayments = async (
  req,
  res
) => {
  try {

    const data = await AdvancePayment.find()
      .populate(
        "labour",
        "labourId phone"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: data.length,
      data
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



// =======================================
// GET ADVANCE BY ID
// =======================================
exports.getAdvancePaymentById = async (
  req,
  res
) => {
  try {

    const data =
      await AdvancePayment.findById(
        req.params.id
      ).populate(
        "labour",
        "labourId phone"
      );

    if (!data) {

      return res.status(404).json({
        message:
          "Advance payment not found"
      });

    }

    res.status(200).json(data);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



// =======================================
// GET ADVANCES BY LABOUR
// =======================================
exports.getAdvancePaymentByLabourId =
  async (req, res) => {
    try {

      const data =
        await AdvancePayment.find({
          labour: req.params.labourId
        }).sort({ date: -1 });

      res.status(200).json({
        count: data.length,
        data
      });

    } catch (error) {

      res.status(500).json({
        error: error.message
      });

    }
  };



// =======================================
// UPDATE ADVANCE
// =======================================
exports.updateAdvance = async (
  req,
  res
) => {
  try {

    const advance =
      await AdvancePayment.findById(
        req.params.id
      );

    if (!advance) {

      return res.status(404).json({
        message:
          "Advance payment not found"
      });

    }

    const {
      labour,
      date,
      advanceAmount,

      deductionType,

      installmentMonths,
      fixedDeductionAmount,

      deductedAmount,
      remainingAmount,
      status
    } = req.body;

    // =======================================
    // UPDATE BASIC FIELDS
    // =======================================

    if (labour !== undefined) {
      advance.labour = labour;
    }

    if (date !== undefined) {
      advance.date = new Date(date);
    }

    if (advanceAmount !== undefined) {
      advance.advanceAmount =
        Number(advanceAmount);
    }

    // =======================================
    // DEDUCTION TYPE
    // =======================================

    if (deductionType !== undefined) {

      const allowedTypes = [
        "Monthly Installment",
        "Fixed Amount",
        "Custom"
      ];

      if (
        !allowedTypes.includes(
          deductionType
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid deduction type"
        });
      }

      advance.deductionType =
        deductionType;

      // reset unused fields
      if (
        deductionType ===
        "Monthly Installment"
      ) {
        advance.fixedDeductionAmount =
          null;
      }

      if (
        deductionType ===
        "Fixed Amount"
      ) {
        advance.installmentMonths =
          null;
      }

      if (
        deductionType ===
        "Custom"
      ) {
        advance.installmentMonths =
          null;

        advance.fixedDeductionAmount =
          null;
      }
    }

    // =======================================
    // INSTALLMENT VALIDATION
    // =======================================

    if (
      advance.deductionType ===
      "Monthly Installment"
    ) {

      if (
        installmentMonths === undefined ||
        Number(installmentMonths) <= 0
      ) {
        return res.status(400).json({
          message:
            "Installment months required"
        });
      }

      advance.installmentMonths =
        Number(installmentMonths);
    }

    // =======================================
    // FIXED AMOUNT VALIDATION
    // =======================================

    if (
      advance.deductionType ===
      "Fixed Amount"
    ) {

      if (
        fixedDeductionAmount ===
          undefined ||
        Number(fixedDeductionAmount) <= 0
      ) {
        return res.status(400).json({
          message:
            "Fixed deduction amount required"
        });
      }

      advance.fixedDeductionAmount =
        Number(
          fixedDeductionAmount
        );
    }

    // =======================================
    // TRACKING
    // =======================================

    if (deductedAmount !== undefined) {
      advance.deductedAmount =
        Number(deductedAmount);
    }

    if (remainingAmount !== undefined) {
      advance.remainingAmount =
        Number(remainingAmount);
    }

    if (status !== undefined) {
      advance.status = status;
    }

    // =======================================
    // AUTO STATUS UPDATE
    // =======================================

    if (advance.remainingAmount <= 0) {

      advance.status = "Paid";
      advance.remainingAmount = 0;

    } else if (
      advance.remainingAmount <
      advance.advanceAmount
    ) {

      advance.status = "Partial";

    } else {

      advance.status = "Pending";

    }

    const updatedAdvance =
      await advance.save();

    res.status(200).json({
      message:
        "Advance payment updated successfully",
      data: updatedAdvance
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



// =======================================
// DELETE ADVANCE
// =======================================
exports.deleteAdvance = async (
  req,
  res
) => {
  try {

    const advance =
      await AdvancePayment.findById(
        req.params.id
      );

    if (!advance) {

      return res.status(404).json({
        message:
          "Advance not found"
      });

    }

    await AdvancePayment.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message:
        "Advance deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};