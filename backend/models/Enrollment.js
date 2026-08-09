const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Institute reference is required']
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Completed', 'Dropped', 'Cancelled'],
      message: '{VALUE} is not a valid enrollment status'
    },
    default: 'Active'
  },
  remarks: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'CreatedBy reference is required']
  }
}, {
  timestamps: true
});

// Enforce unique compound index to prevent duplicate enrollments
enrollmentSchema.index({ student: 1, batch: 1 }, { unique: true });
// Compound index for optimizing institute-level listing lookups
enrollmentSchema.index({ institute: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
