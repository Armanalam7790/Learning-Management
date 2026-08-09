const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment reference is required']
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
  submissionFile: {
    type: String,
    default: ''
  },
  submissionText: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  marksObtained: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Submitted', 'Reviewed', 'Late'],
      message: '{VALUE} is not a valid submission status'
    },
    default: 'Submitted'
  }
}, {
  timestamps: true
});

// Enforce unique index for Student + Assignment combination to prevent duplicate submissions
assignmentSubmissionSchema.index({ student: 1, assignment: 1 }, { unique: true });
// Compound index for optimizing institute-level listing lookups
assignmentSubmissionSchema.index({ institute: 1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
