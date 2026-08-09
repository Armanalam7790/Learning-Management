const express = require('express');
const router = express.Router();
const {
  createInstitute,
  getAllInstitutes,
  getSingleInstitute,
  updateInstitute,
  deleteInstitute
} = require('../controllers/instituteController');
const {authMiddleware} = require('../middleware/authMiddleware');

// Routes mapping
router.post('/', createInstitute);
router.get('/', getAllInstitutes);
router.get('/:id', getSingleInstitute);
router.patch('/:id', authMiddleware, updateInstitute);
router.delete('/:id', authMiddleware, deleteInstitute);

module.exports = router;
