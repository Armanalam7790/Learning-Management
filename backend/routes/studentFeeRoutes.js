const express = require('express');
const router = express.Router();
const {
  createStudentFee,
  getAllStudentFees,
  getSingleStudentFee,
  updateStudentFee
} = require('../controllers/studentFeeController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// StudentFee ledger assignment endpoints
router.post('/', restrictTo('admin'), createStudentFee);
router.get('/', getAllStudentFees); // Admin, Teacher, and Student (student reads only their own)
router.get('/:id', getSingleStudentFee); // Admin, Teacher, and Student (student reads only their own)
router.patch('/:id', restrictTo('admin'), updateStudentFee);

module.exports = router;
