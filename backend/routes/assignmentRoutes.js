const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAllAssignments,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');
const {
  createSubmission,
  getAssignmentSubmissions
} = require('../controllers/assignmentSubmissionController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Assignment CRUD endpoints
router.post('/', restrictTo('admin', 'teacher'), createAssignment);
router.get('/', getAllAssignments); // Admin, Teacher, and Student can read
router.get('/:id', getSingleAssignment); // Admin, Teacher, and Student can read
router.patch('/:id', restrictTo('admin', 'teacher'), updateAssignment);
router.delete('/:id', restrictTo('admin', 'teacher'), deleteAssignment);

// Nested Submission endpoints
router.post('/:assignmentId/submit', restrictTo('student'), createSubmission);
router.get('/:assignmentId/submissions', restrictTo('admin', 'teacher'), getAssignmentSubmissions);

module.exports = router;
