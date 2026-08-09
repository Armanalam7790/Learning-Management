const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getAllTeachers,
  getSingleTeacher,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teacherController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes: Request -> authMiddleware -> restrictTo('admin')
router.use(authMiddleware);
router.use(restrictTo('admin'));

// Routes mapping
router.post('/', createTeacher);
router.get('/', getAllTeachers);
router.get('/:id', getSingleTeacher);
router.patch('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

module.exports = router;
