// const Attendance = require("../models/Attendance");
// const moment = require("moment");
// const { generatePDF } = require("../utils/pdfGenerator");

// // Dummy labour master (later DB la move pannalam)
// const labourData = {
//   L001: { name: "Ravi", workType: "Plumbing" },
//   L002: { name: "Kumar", workType: "Carpenter" }
// };

// // ➕ ADD ATTENDANCE
// exports.addAttendance = async (req, res) => {
//   try {
//     const { labourId, date, startTime, endTime } = req.body;

//     const labour = labourData[labourId];
//     if (!labour) return res.status(404).json({ message: "Labour not found" });

//     let start = moment(startTime, "HH:mm");
//     let end = moment(endTime, "HH:mm");

//     let hours = moment.duration(end.diff(start)).asHours();
//     if (hours < 0) hours += 24;

//     let overtime = hours > 8 ? hours - 8 : 0;

//     const attendance = new Attendance({
//       labourId,
//       date,
//       name: labour.name,
//       workType: labour.workType,
//       startTime,
//       endTime,
//       totalHours: hours,
//       overtime
//     });

//     await attendance.save();

//     res.json({
//       message: "Attendance saved successfully",
//       attendance
//     });

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// // 📄 MONTHLY PDF
// exports.monthlyReport = async (req, res) => {
//   try {
//     const { month } = req.params;

//     const data = await Attendance.find({
//       date: { $regex: `^${month}` }
//     });

//     generatePDF(data, month, res);

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// ==================================

// const Attendance = require("../models/Attendance");
// const moment = require("moment");
// const { generatePDF } = require("../utils/pdfGenerator");

// // Dummy labour master (later DB la move pannalam)
// const labourData = {
//   L001: { name: "Ravi", workType: "Plumbing" },
//   L002: { name: "Kumar", workType: "Carpenter" }
// };



// // ➕ ADD ATTENDANCE
// exports.addAttendance = async (req, res) => {
//   try {
//     const { labourId, date, startTime, endTime } = req.body;

//     const labour = labourData[labourId];
//     if (!labour) {
//       return res.status(404).json({ message: "Labour not found" });
//     }

//     // ❗ Duplicate check
//     const existing = await Attendance.findOne({ labourId, date });
//     if (existing) {
//       return res.status(400).json({ message: "Attendance already marked" });
//     }

//     let start = moment(startTime, "HH:mm");
//     let end = moment(endTime, "HH:mm");

//     let hours = moment.duration(end.diff(start)).asHours();
//     if (hours < 0) hours += 24;

//     let overtime = hours > 8 ? hours - 8 : 0;

//     const attendance = new Attendance({
//       labourId,
//       date,
//       name: labour.name,
//       workType: labour.workType,
//       startTime,
//       endTime,
//       totalHours: hours,
//       overtime
//     });

//     await attendance.save();

//     res.json({
//       message: "Attendance saved successfully",
//       attendance
//     });

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };



// // 📌 GET ALL
// exports.getAllAttendance = async (req, res) => {
//   try {
//     const data = await Attendance.find().sort({ date: -1 });
//     res.json(data);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };



// // 📌 GET BY ID
// exports.getAttendanceById = async (req, res) => {
//   try {
//     const data = await Attendance.findById(req.params.id);

//     if (!data) {
//       return res.status(404).json({ message: "Attendance not found" });
//     }

//     res.json(data);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };



// // ✏️ UPDATE (with recalculation)
// exports.updateAttendance = async (req, res) => {
//   try {
//     const { startTime, endTime } = req.body;

//     let updateData = { ...req.body };

//     // 👉 If time updated → recalculate
//     if (startTime && endTime) {
//       let start = moment(startTime, "HH:mm");
//       let end = moment(endTime, "HH:mm");

//       let hours = moment.duration(end.diff(start)).asHours();
//       if (hours < 0) hours += 24;

//       let overtime = hours > 8 ? hours - 8 : 0;

//       updateData.totalHours = hours;
//       updateData.overtime = overtime;
//     }

//     const updated = await Attendance.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Attendance not found" });
//     }

//     res.json(updated);

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };



// // 🗑️ DELETE
// exports.deleteAttendance = async (req, res) => {
//   try {
//     const deleted = await Attendance.findByIdAndDelete(req.params.id);

//     if (!deleted) {
//       return res.status(404).json({ message: "Attendance not found" });
//     }

//     res.json({ message: "Attendance deleted successfully" });

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };



// // 📄 MONTHLY PDF
// exports.monthlyReport = async (req, res) => {
//   try {
//     const { month } = req.params;

//     const data = await Attendance.find({
//       date: { $regex: `^${month}` }
//     });

//     generatePDF(data, month, res);

//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

const Attendance = require("../models/Attendance");
const Labour = require("../models/Labour"); // 👈 IMPORTANT
const moment = require("moment");
const { generatePDF } = require("../utils/pdfGenerator");



// ➕ ADD ATTENDANCE
exports.addAttendance = async (req, res) => {
  try {
    const { labourId, date, startTime, endTime } = req.body;

  // 🔥 Get labour from DB
const labour = await Labour.findOne({ labourId });

if (!labour) {
  return res.status(404).json({ message: "Labour not found" });
}

    // ❗ Duplicate check
    const existing = await Attendance.findOne({ labourId, date });
    if (existing) {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    // ⏱️ Time calculation
    let start = moment(startTime, "HH:mm");
    let end = moment(endTime, "HH:mm");

    let hours = moment.duration(end.diff(start)).asHours();
    if (hours < 0) hours += 24;

    let overtime = hours > 8 ? hours - 8 : 0;

    const attendance = new Attendance({
      labourId,
      date,
      name: labour.name,
      workType: labour.workType,
      startTime,
      endTime,
      totalHours: hours,
      overtime
    });

    await attendance.save();

    res.json({
      message: "Attendance saved successfully",
      attendance
    });

  } catch (err) {
    res.status(500).json(err);
  }
};



// 📌 GET ALL
exports.getAllAttendance = async (req, res) => {
  try {
    const data = await Attendance.find().sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};



// 📌 GET BY ID
exports.getAttendanceById = async (req, res) => {
  try {
    const data = await Attendance.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};



// ✏️ UPDATE (with recalculation)
exports.updateAttendance = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    let updateData = { ...req.body };

    // 👉 If time updated → recalculate
    if (startTime && endTime) {
      let start = moment(startTime, "HH:mm");
      let end = moment(endTime, "HH:mm");

      let hours = moment.duration(end.diff(start)).asHours();
      if (hours < 0) hours += 24;

      let overtime = hours > 8 ? hours - 8 : 0;

      updateData.totalHours = hours;
      updateData.overtime = overtime;
    }

    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json(err);
  }
};



// 🗑️ DELETE
exports.deleteAttendance = async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json({ message: "Attendance deleted successfully" });

  } catch (err) {
    res.status(500).json(err);
  }
};



// 📄 MONTHLY PDF
exports.monthlyReport = async (req, res) => {
  try {
    const { month } = req.params;

    const data = await Attendance.find({
      date: { $regex: `^${month}` }
    });

    generatePDF(data, month, res);

  } catch (err) {
    res.status(500).json(err);
  }
};


//MONTHLY PDF BY LABOURID
exports.labourMonthlyReport = async (req, res) => {
  try {
    const { labourId, month } = req.params;

    // 🔥 filter by labour + month
    const data = await Attendance.find({
      labourId: labourId,
      date: { $regex: `^${month}` }
    });

    if (data.length === 0) {
      return res.status(404).json({ message: "No attendance found" });
    }

    generatePDF(data, `${labourId}-${month}`, res);

  } catch (err) {
    res.status(500).json(err);
  }
};