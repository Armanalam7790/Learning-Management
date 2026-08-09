const express = require('express');
const router = express.Router();
const { getCourseAnalytics } = require('../controllers/dashboardController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect dashboard route
router.use(authMiddleware);

// Admin-only dashboard aggregations
router.get('/course-analytics', restrictTo('admin'), getCourseAnalytics);

module.exports = router;
