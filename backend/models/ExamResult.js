const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam reference is required']
  },
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
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Institute reference is required']
  },
  obtainedMarks: {
    type: Number,
    required: [true, 'Obtained marks is required'],
    min: [0, 'Obtained marks cannot be negative']
  },
  grade: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'EvaluatedBy reference is required']
  },
  evaluatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Evaluated', 'Published'],
      message: '{VALUE} is not a valid exam result status'
    },
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Enforce unique index for Student + Exam combination to prevent duplicate result entries
examResultSchema.index({ student: 1, exam: 1 }, { unique: true });
// Compound index for optimizing institute-level listing lookups
examResultSchema.index({ institute: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
