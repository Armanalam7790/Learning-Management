const express = require('express');
const router = express.Router();
const { setupAdmin, login, getCurrentUser } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Auth routes mapping
router.post('/setup-admin', setupAdmin);
router.post('/login', login);
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
