const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  days: {
    type: [String],
    required: [true, 'Days of schedule are required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true
  }
}, { _id: false });

const batchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true
  },
  batchCode: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher reference is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Institute reference is required']
  },
  schedule: {
    type: scheduleSchema,
    required: [true, 'Schedule details are required']
  },
  maximumStudents: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: [1, 'Maximum students must be greater than zero']
  },
  currentStudents: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: ['upcoming', 'ongoing', 'completed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'upcoming'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  }
}, {
  timestamps: true
});

// Compound index for optimized institute-level active batch queries
batchSchema.index({ institute: 1, isActive: 1 });

module.exports = mongoose.model('Batch', batchSchema);
