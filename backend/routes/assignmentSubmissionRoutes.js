const express = require('express');
const router = express.Router();
const {
  getSingleSubmission,
  updateSubmission,
  deleteSubmission,
  gradeSubmission
} = require('../controllers/assignmentSubmissionController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Standalone Submission actions
router.get('/:id', getSingleSubmission); // Admin, Teacher, and Submitter Student can read
router.patch('/:id', restrictTo('student'), updateSubmission);
router.delete('/:id', restrictTo('student'), deleteSubmission);

// Grading endpoint
router.patch('/:id/grade', restrictTo('admin', 'teacher'), gradeSubmission);

module.exports = router;
