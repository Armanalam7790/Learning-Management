const express = require('express');
const router = express.Router();
const {
  createExam,
  getAllExams,
  getSingleExam,
  updateExam,
  deleteExam
} = require('../controllers/examController');
const {
  createExamResult,
  getExamResults
} = require('../controllers/examResultController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Exam CRUD endpoints
router.post('/', restrictTo('admin', 'teacher'), createExam);
router.get('/', getAllExams); // Admin, Teacher, and Students can list
router.get('/:id', getSingleExam); // Admin, Teacher, and Students can read details
router.patch('/:id', restrictTo('admin', 'teacher'), updateExam);
router.delete('/:id', restrictTo('admin', 'teacher'), deleteExam);

// Nested evaluation endpoints
router.post('/:examId/results', restrictTo('admin', 'teacher'), createExamResult);
router.get('/:examId/results', getExamResults); // Admin, Teacher, and Student (student gets only their own results)

module.exports = router;
