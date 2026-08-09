const express = require('express');
const router = express.Router();
const {
  createBatch,
  getAllBatches,
  getSingleBatch,
  updateBatch,
  deleteBatch
} = require('../controllers/batchController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

// Protect all batch routes: must be authenticated and have an admin role
router.use(authMiddleware);
router.use(restrictTo('admin'));

// Route mapping
router.post('/', createBatch);
router.get('/', getAllBatches);
router.get('/:id', getSingleBatch);
router.patch('/:id', updateBatch);
router.delete('/:id', deleteBatch);

module.exports = router;
