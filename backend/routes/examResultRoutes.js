const express = require('express');
const router = express.Router();
const {
  getSingleResult,
  updateExamResult,
  deleteExamResult,
  publishExamResult
} = require('../controllers/examResultController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Standalone result details and editing
router.get('/:id', getSingleResult); // Admin, Teacher, and Student (student can read only if published)
router.patch('/:id', restrictTo('admin', 'teacher'), updateExamResult);
router.delete('/:id', restrictTo('admin', 'teacher'), deleteExamResult);

// Publishing endpoint
router.patch('/:id/publish', restrictTo('admin', 'teacher'), publishExamResult);

module.exports = router;
