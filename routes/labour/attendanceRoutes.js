const express = require("express");
const router = express.Router();

const {
  createAttendance,
  getAllAttendance,
  getAttendanceByDate,
  getAttendanceByLabour,
  updateAttendance,
  deleteAttendance,
  getLabourMonthlyDetails,
  getMonthlyReportExcel
} = require("../../controllers/labour/attendanceController");


// ========================
// CREATE ATTENDANCE
// ========================
router.post("/add", createAttendance);


// ========================
// GET ALL ATTENDANCE
// ========================
router.get("/getall", getAllAttendance);


// ========================
// GET BY DATE
// ========================
router.get("/get-by-date/:date", getAttendanceByDate);


// ========================
// GET BY LABOUR ID (LB001)
// ========================
router.get("/get-by-labourId/:labourId", getAttendanceByLabour);


// ========================
// UPDATE ATTENDANCE
// ========================
router.put("/update/:id", updateAttendance);


// ========================
// DELETE ATTENDANCE
// ========================
router.delete("/delete/:id", deleteAttendance);


// ========================
// MONTHLY DETAILS (SINGLE LABOUR)
// ========================
router.get(
  "/monthly/:labourId/:year/:month",
  getLabourMonthlyDetails
);


// ========================
// MONTHLY EXCEL REPORT (ALL LABOURS)
// ========================
router.get(
  "/report-excel/:month/:year",
  getMonthlyReportExcel
);


module.exports = router;