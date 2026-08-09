const express = require('express');
const router = express.Router();
const {
  generateBatchResults,
  generateStudentResult,
  getAllResults,
  getSingleResult,
  getResultsByStudent,
  getResultsByBatch,
  publishResult,
  lockResult,
  unlockResult,
  deleteResult
} = require('../controllers/academicResultController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Results generation (Admin and Teachers only)
router.post('/generate', restrictTo('admin', 'teacher'), generateBatchResults);
router.post('/generate/:studentId', restrictTo('admin', 'teacher'), generateStudentResult);

// Standard result retrievals
router.get('/', getAllResults); // Admin, Teacher, and Student can list
router.get('/:id', getSingleResult); // Admin, Teacher, and Student can read details
router.get('/student/:studentId', getResultsByStudent);
router.get('/batch/:batchId', getResultsByBatch);

// Administrative controls (Admin only)
router.patch('/:id/publish', restrictTo('admin'), publishResult);
router.patch('/:id/lock', restrictTo('admin'), lockResult);
router.patch('/:id/unlock', restrictTo('admin'), unlockResult);

// Deletion (Admin and Teachers)
router.delete('/:id', restrictTo('admin', 'teacher'), deleteResult);

module.exports = router;
