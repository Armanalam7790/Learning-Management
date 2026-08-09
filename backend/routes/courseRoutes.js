const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Course CRUD endpoints
router.post('/', restrictTo('admin'), createCourse);
router.get('/', getAllCourses); // Admin, Teacher, and Student can list
router.get('/:id', getCourseById); // Admin, Teacher, and Student can read details
router.patch('/:id', restrictTo('admin'), updateCourse);
router.delete('/:id', restrictTo('admin'), deleteCourse);

module.exports = router;
