const Attendance = require("../../models/labour/Attendance");
const Labour = require("../../models/labour/Labour");
const ExcelJS = require("exceljs");


// 🔥 Calculate working + overtime
const calculateHours = (start, end) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  let diff = (endMin - startMin) / 60;

  if (diff < 0) throw new Error("End time must be greater than start time");

  const totalHours = Number(diff.toFixed(2));
  const overtimeHours =
    totalHours > 8 ? Number((totalHours - 8).toFixed(2)) : 0;

  return { totalHours, overtimeHours };
};



// =========================
// CREATE ATTENDANCE
// =========================
exports.createAttendance = async (req, res) => {
  try {
    const { date, siteName, labours } = req.body;

    const records = [];

    for (let item of labours) {
      const labourData = await Labour.findById(item.labourId);

      if (!labourData) continue;

      const [year, month, day] =
        date.split("-").map(Number);

      const selectedDate =
        new Date(Date.UTC(year, month - 1, day));
  

      const nextDate = new Date(selectedDate);
        nextDate.setUTCDate(
          nextDate.getUTCDate() + 1
        );
      const exists = await Attendance.findOne({
        labour: labourData._id,
        date: { $gte: selectedDate, $lt: nextDate }
      });

      if (exists) continue;

      const { totalHours, overtimeHours } = calculateHours(
        item.startTime,
        item.endTime
      );

      records.push({
        date: selectedDate,
        labour: labourData._id,
        siteName,
        startTime: item.startTime,
        endTime: item.endTime,
        totalHours,
        overtimeHours
      });
    }

    if (records.length === 0) {
      return res.status(400).json({ message: "No valid attendance to save" });
    }

    const saved = await Attendance.insertMany(records);

    res.status(201).json({
      message: "Attendance created",
      count: saved.length,
      data: saved
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// =========================
// GET ALL ATTENDANCE
// =========================
exports.getAllAttendance = async (req, res) => {
  try {
    const data = await Attendance.find()
      .populate("labour", "name");

    res.json({
      count: data.length,
      data
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// =========================
// GET BY DATE
// =========================
exports.getAttendanceByDate = async (req, res) => {
  try {
    const dateStr = req.params.date;

    const selectedDate = new Date(dateStr + "T00:00:00.000Z");
    const nextDate = new Date(selectedDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const data = await Attendance.find({
      date: { $gte: selectedDate, $lt: nextDate }
    }).populate("labour", "name");

    res.json({
      count: data.length,
      data
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// =========================
// GET BY LABOUR (BY _id)
// =========================
exports.getAttendanceByLabour = async (req, res) => {
  try {
    const labourData = await Labour.findById(req.params.labourId);

    if (!labourData) {
      return res.status(404).json({ message: "Labour not found" });
    }

    const data = await Attendance.find({
      labour: labourData._id
    }).populate("labour", "name");

    res.json({
      count: data.length,
      data
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// =========================
// UPDATE ATTENDANCE
// =========================
exports.updateAttendance = async (req, res) => {
  try {

    const { startTime, endTime, siteName } = req.body;

    // =========================
    // FIND EXISTING ATTENDANCE
    // =========================

    const attendance =
      await Attendance.findById(req.params.id);

    if (!attendance) {

      return res.status(404).json({
        message: "Attendance not found"
      });

    }

    const updateData = {};

    // =========================
    // SITE NAME
    // =========================

    if (siteName !== undefined) {
      updateData.siteName = siteName;
    }

    // =========================
    // USE OLD VALUES IF NEW NOT GIVEN
    // =========================

    const newStartTime =
      startTime || attendance.startTime;

    const newEndTime =
      endTime || attendance.endTime;

    // =========================
    // RECALCULATE HOURS
    // =========================

    const { totalHours, overtimeHours } =
      calculateHours(newStartTime, newEndTime);

    updateData.startTime = newStartTime;

    updateData.endTime = newEndTime;

    updateData.totalHours = totalHours;

    updateData.overtimeHours = overtimeHours;

    // =========================
    // UPDATE
    // =========================

    const updated =
      await Attendance.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

    res.json(updated);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



// =========================
// DELETE ATTENDANCE
// =========================
exports.deleteAttendance = async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json({ message: "Attendance deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// =========================
// MONTHLY REPORT (FAST)
// =========================
const generateMonthlyReport = async (month, year) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const labours = await Labour.find()
    .select("_id name workType dailyWage")
    .lean();

  const labourMap = new Map(
    labours.map(l => [l._id.toString(), l])
  );

  const result = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: "$labour",
        totalDays: { $sum: 1 },
        totalHours: { $sum: "$totalHours" },
        totalOvertime: { $sum: "$overtimeHours" }
      }
    }
  ]);

  return result
    .map(item => {
      const labour = labourMap.get(item._id.toString());
      if (!labour) return null;

      const perHour = (labour.dailyWage || 0) / 8;

      const totalHours = item.totalHours || 0;
      const totalOvertime = item.totalOvertime || 0;

      const normalHours = totalHours - totalOvertime;
      const normalSalary = normalHours * perHour;
      const overtimeSalary = totalOvertime * perHour;

      const totalSalary = normalSalary + overtimeSalary;

      return {
        labourId: labour._id,
        name: labour.name,
        workType: labour.workType,
        dailyWage: labour.dailyWage,

        totalDays: item.totalDays,
        totalHours: Number(totalHours.toFixed(2)),
        totalOvertime: Number(totalOvertime.toFixed(2)),
        totalSalary: Number(totalSalary.toFixed(2))
      };
    })
    .filter(Boolean);
};



// =========================
// SINGLE LABOUR MONTHLY DETAILS
// =========================
exports.getLabourMonthlyDetails = async (req, res) => {
  try {
    const { labourId, year, month } = req.params;

    const labour = await Labour.findById(labourId);

    if (!labour) {
      return res.status(404).json({ message: "Labour not found" });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const attendance = await Attendance.find({
      labour: labour._id,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: 1 });

    let totalDays = attendance.length;
    let totalHours = 0;
    let totalOvertime = 0;
    let totalSalary = 0;

    const perHour = labour.dailyWage / 8;

    const attendanceWithSalary = attendance.map(a => {
      totalHours += a.totalHours;
      totalOvertime += a.overtimeHours;

      const normalHours = Math.min(a.totalHours, 8);

      const daySalary =
        (normalHours * perHour) +
        (a.overtimeHours * perHour);

      totalSalary += daySalary;

      return {
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        totalHours: a.totalHours,
        overtimeHours: a.overtimeHours,
        daySalary: Number(daySalary.toFixed(2))
      };
    });

    res.json({
      labourId: labour._id,
      name: labour.name,
      workType: labour.workType,
      dailyWage: labour.dailyWage,
      month,
      year,

      attendance: attendanceWithSalary,

      summary: {
        totalDays,
        totalHours: Number(totalHours.toFixed(2)),
        totalOvertime: Number(totalOvertime.toFixed(2)),
        totalSalary: Number(totalSalary.toFixed(2))
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// =========================
// EXCEL EXPORT
// =========================
exports.getMonthlyReportExcel = async (req, res) => {
  try {
    const { month, year } = req.params;

    const reportData = await generateMonthlyReport(month, year);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Report");

    worksheet.columns = [
      { header: "Labour ID", key: "labourId", width: 15 },
      { header: "Name", key: "name", width: 20 },
      { header: "Work Type", key: "workType", width: 20 },
      { header: "Daily Wage", key: "dailyWage", width: 15 },
      { header: "Days", key: "totalDays", width: 10 },
      { header: "Hours", key: "totalHours", width: 15 },
      { header: "Overtime", key: "totalOvertime", width: 15 },
      { header: "Salary", key: "totalSalary", width: 15 }
    ];

    reportData.forEach(r => worksheet.addRow(r));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_${month}_${year}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};