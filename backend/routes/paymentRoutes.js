const express = require('express');
const router = express.Router();
const {
  createPayment,
  getAllPayments,
  getSinglePayment,
  getPaymentsByStudent,
  deletePayment
} = require('../controllers/paymentController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Payment transaction endpoints
router.post('/', restrictTo('admin'), createPayment);
router.get('/', getAllPayments); // Admin, Teacher, and Student (student reads only their own)
router.get('/:id', getSinglePayment); // Admin, Teacher, and Student (student reads only their own)
router.delete('/:id', restrictTo('admin'), deletePayment);

// List student payments
router.get('/student/:studentId', getPaymentsByStudent);

module.exports = router;
