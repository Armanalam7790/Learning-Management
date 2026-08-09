const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher reference is required']
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
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  attachment: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maximumMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: [1, 'Maximum marks must be greater than zero']
  },
  status: {
    type: String,
    enum: {
      values: ['Draft', 'Published', 'Closed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Draft'
  }
}, {
  timestamps: true
});

// Index for optimized batch-scoped queries
assignmentSchema.index({ batch: 1 });
// Compound index for optimizing institute listing lookups
assignmentSchema.index({ institute: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
