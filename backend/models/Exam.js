const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    trim: true
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration (in minutes) is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  maximumMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: [1, 'Maximum marks must be greater than zero']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [1, 'Passing marks must be greater than zero'],
    validate: {
      validator: function (val) {
        return val <= this.maximumMarks;
      },
      message: 'Passing marks cannot exceed maximum marks'
    }
  },
  instructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: ['Draft', 'Scheduled', 'Completed', 'Published', 'Cancelled'],
      message: '{VALUE} is not a valid exam status'
    },
    default: 'Draft'
  }
}, {
  timestamps: true
});

// Index for batch exams list
examSchema.index({ batch: 1 });
// Compound index for optimizing institute lookups
examSchema.index({ institute: 1 });

module.exports = mongoose.model('Exam', examSchema);
