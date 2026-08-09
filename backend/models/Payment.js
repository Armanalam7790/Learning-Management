const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentFee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentFee',
    required: [true, 'StudentFee reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [1, 'Payment amount must be greater than zero']
  },
  paymentMode: {
    type: String,
    required: [true, 'Payment mode is required'],
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['Pending', 'Success', 'Failed'],
      message: '{VALUE} is not a valid payment status'
    },
    default: 'Success'
  },
  transactionId: {
    type: String,
    default: ''
  },
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required'],
    unique: true,
    trim: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'CollectedBy reference is required']
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
