const express = require('express');
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getSingleStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');


router.use(authMiddleware);
router.use(restrictTo('admin'));

// Routes mapping
router.post('/', createStudent);
router.get('/', getAllStudents);
router.get('/:id', getSingleStudent);
router.patch('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
