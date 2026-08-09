const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Institute reference is required']
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch reference is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  feeName: {
    type: String,
    required: [true, 'Fee name is required'],
    trim: true
  },
  tuitionFee: {
    type: Number,
    default: 0,
    min: [0, 'Tuition fee cannot be negative']
  },
  admissionFee: {
    type: Number,
    default: 0,
    min: [0, 'Admission fee cannot be negative']
  },
  examFee: {
    type: Number,
    default: 0,
    min: [0, 'Exam fee cannot be negative']
  },
  libraryFee: {
    type: Number,
    default: 0,
    min: [0, 'Library fee cannot be negative']
  },
  transportFee: {
    type: Number,
    default: 0,
    min: [0, 'Transport fee cannot be negative']
  },
  otherCharges: {
    type: Number,
    default: 0,
    min: [0, 'Other charges cannot be negative']
  },
  totalFee: {
    type: Number,
    default: 0
  },
  installmentPlan: {
    type: String,
    default: 'One-time'
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Active'
  }
}, {
  timestamps: true
});

// Enforce compound uniqueness for Batch + FeeName to prevent duplicates
feeStructureSchema.index({ batch: 1, feeName: 1 }, { unique: true });
// Optimize institute-level lookups
feeStructureSchema.index({ institute: 1 });

// Pre-save hook to calculate totalFee dynamically
feeStructureSchema.pre('save', function () {
  this.totalFee =
    (this.tuitionFee || 0) +
    (this.admissionFee || 0) +
    (this.examFee || 0) +
    (this.libraryFee || 0) +
    (this.transportFee || 0) +
    (this.otherCharges || 0);
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
