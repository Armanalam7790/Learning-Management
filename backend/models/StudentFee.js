const mongoose = require('mongoose');

const studentFeeSchema = new mongoose.Schema({
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
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: [true, 'FeeStructure reference is required']
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Institute reference is required']
  },
  totalFee: {
    type: Number,
    required: [true, 'Total fee is required'],
    min: [0, 'Total fee cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  scholarship: {
    type: Number,
    default: 0,
    min: [0, 'Scholarship cannot be negative']
  },
  lateFee: {
    type: Number,
    default: 0,
    min: [0, 'Late fee cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['Unpaid', 'Partially Paid', 'Paid'],
      message: '{VALUE} is not a valid fee status'
    },
    default: 'Unpaid'
  }
}, {
  timestamps: true
});

// Enforce uniqueness for Student + FeeStructure to prevent duplicate ledger assignments
studentFeeSchema.index({ student: 1, feeStructure: 1 }, { unique: true });
// Optimize institute-level lookups
studentFeeSchema.index({ institute: 1 });

// Pre-save hook to calculate pendingAmount and payment status dynamically
studentFeeSchema.pre('save', function () {
  const netFee = (this.totalFee || 0) - (this.discount || 0) - (this.scholarship || 0) + (this.lateFee || 0);
  this.pendingAmount = netFee - (this.paidAmount || 0);

  if (this.pendingAmount < 0) {
    this.pendingAmount = 0;
  }

  if (this.paidAmount === 0) {
    this.status = 'Unpaid';
  } else if (this.pendingAmount <= 0) {
    this.status = 'Paid';
  } else {
    this.status = 'Partially Paid';
  }
});

module.exports = mongoose.model('StudentFee', studentFeeSchema);
