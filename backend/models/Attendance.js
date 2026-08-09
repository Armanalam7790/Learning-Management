const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch reference is required']
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: [true, 'Enrollment reference is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher reference is required']
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Institute reference is required']
  },
  attendanceDate: {
    type: Date,
    required: [true, 'Attendance date is required']
  },
  status: {
    type: String,
    enum: {
      values: ['Present', 'Absent', 'Late', 'Leave'],
      message: '{VALUE} is not a valid attendance status'
    },
    required: [true, 'Attendance status is required']
  },
  remarks: {
    type: String,
    default: ''
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'MarkedBy reference is required']
  }
}, {
  timestamps: true
});

// Enforce unique index for Student + Batch + Date combination
attendanceSchema.index({ student: 1, batch: 1, attendanceDate: 1 }, { unique: true });
// Compound index for optimizing institute-level listing lookups
attendanceSchema.index({ institute: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
