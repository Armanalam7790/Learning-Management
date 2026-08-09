const express = require('express');
const router = express.Router();
const {
  createAttendance,
  getAllAttendance,
  getSingleAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByStudent,
  getAttendanceByBatch,
  getAttendanceByDate
} = require('../controllers/attendanceController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with JWT verification and role restriction (Admin and Teacher only)
router.use(authMiddleware);
router.use(restrictTo('admin', 'teacher'));

// CRUD mappings
router.post('/', createAttendance);
router.get('/', getAllAttendance);
router.get('/:id', getSingleAttendance);
router.patch('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

// Bonus API mappings
router.get('/student/:studentId', getAttendanceByStudent);
router.get('/batch/:batchId', getAttendanceByBatch);
router.get('/date/:date', getAttendanceByDate);

module.exports = router;
