const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  date: String,
  labourId: String,
  name: String,
  workType: String,
  startTime: String,
  endTime: String,
  totalHours: Number,
  overtime: Number
});

module.exports = mongoose.model("Attendance", attendanceSchema);