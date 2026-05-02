const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
{
  date: {
    type: Date,
    required: true
  },

  // for db reference
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labour",
    required: true
  },

  siteName: {
    type: String,
    required: true
  },

  startTime: {
    type: String, // "09:00"
    required: true
  },

  endTime: {
    type: String, // "18:30"
    required: true
  },

  totalHours: {
    type: Number,
    default: 0
  },

  overtimeHours: {
    type: Number,
    default: 0
  }
},
{ timestamps: true }
);

// duplicate attendance (same labour + same date)
attendanceSchema.index({ labour: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);