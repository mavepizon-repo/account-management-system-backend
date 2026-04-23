// const express = require("express");
// const router = express.Router();

// const {
//   addAttendance,
//   monthlyReport
// } = require("../controllers/attendanceController");

// router.post("/add", addAttendance);

// router.get("/all", getAllAttendance);
// router.get("/report/:month", monthlyReport); // 👈 first
// router.get("/:id", getAttendanceById);

// router.put("/update/:id", updateAttendance);

// router.delete("/delete/:id", deleteAttendance);

// module.exports = router;
const express = require("express");
const router = express.Router();

const {
  addAttendance,
  monthlyReport,
  labourMonthlyReport, 
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
} = require("../controllers/attendanceController");

router.post("/add", addAttendance);

router.get("/all", getAllAttendance);

// ⚠️ order important
router.get("/report/:month", monthlyReport);
router.get("/:id", getAttendanceById);

router.put("/update/:id", updateAttendance);

router.delete("/delete/:id", deleteAttendance);

router.get("/report/:labourId/:month", labourMonthlyReport);
router.get("/report/:month", monthlyReport); // 👈 next

module.exports = router;