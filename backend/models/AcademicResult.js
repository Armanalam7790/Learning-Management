const mongoose = require('mongoose');

const academicResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: [true, 'Enrollment reference is required']
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch reference is required']
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Institute reference is required']
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam reference is required']
  },
  assignmentScore: {
    type: Number,
    default: 0
  },
  examScore: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    default: 0
  },
  internalMarks: {
    type: Number,
    default: 0
  },
  externalMarks: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  maximumMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    required: [true, 'Grade calculation is required']
  },
  rank: {
    type: Number,
    default: null
  },
  resultStatus: {
    type: String,
    enum: {
      values: ['Pass', 'Fail'],
      message: '{VALUE} is not a valid result status'
    },
    required: [true, 'Result status is required']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'GeneratedBy reference is required']
  },
  publishedAt: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Enforce unique combinations for Student + Exam to prevent duplicates
academicResultSchema.index({ student: 1, exam: 1 }, { unique: true });
// Optimize institute-level queries
academicResultSchema.index({ institute: 1 });

module.exports = mongoose.model('AcademicResult', academicResultSchema);
