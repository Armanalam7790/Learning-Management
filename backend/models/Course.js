const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    required: [true, 'Course duration is required']
  },
  totalFees: {
    type: Number,
    required: [true, 'Total fees is required'],
    min: [0, 'Total fees cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Active'
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Institute reference is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'CreatedBy reference is required']
  }
}, {
  timestamps: true
});

// Enforce unique courseCode per institute (multi-tenancy safe uniqueness)
courseSchema.index({ institute: 1, courseCode: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
