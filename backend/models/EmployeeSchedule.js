const mongoose = require("mongoose");

const EmployeeScheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    enum: ["morning", "afternoon", "evening"],
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure an employee can only be scheduled once per shift per day
EmployeeScheduleSchema.index({ date: 1, shift: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model("employeeSchedule", EmployeeScheduleSchema);