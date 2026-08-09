const express = require('express');
const router = express.Router();
const {
  createFeeStructure,
  getAllFeeStructures,
  getSingleFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
} = require('../controllers/feeStructureController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// FeeStructure CRUD paths
router.post('/', restrictTo('admin'), createFeeStructure);
router.get('/', getAllFeeStructures); // Admin, Teacher, and Student can list
router.get('/:id', getSingleFeeStructure); // Admin, Teacher, and Student can view details
router.patch('/:id', restrictTo('admin'), updateFeeStructure);
router.delete('/:id', restrictTo('admin'), deleteFeeStructure);

module.exports = router;
