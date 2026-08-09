const express = require('express');
const router = express.Router();
const {
  createEnrollment,
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getStudentsByBatch,
  getBatchesByStudent
} = require('../controllers/enrollmentController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with JWT verification and admin role restriction
router.use(authMiddleware);
router.use(restrictTo('admin'));

// CRUD mappings
router.post('/', createEnrollment);
router.get('/', getAllEnrollments);
router.get('/:id', getSingleEnrollment);
router.patch('/:id', updateEnrollment);
router.delete('/:id', deleteEnrollment);

// Bonus API mappings
router.get('/batch/:batchId', getStudentsByBatch);
router.get('/student/:studentId', getBatchesByStudent);

module.exports = router;
