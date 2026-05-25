const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  getAllInvestors,
  getAllEntrepreneurs
} = require('../controllers/profileController');

router.get('/investors', protect, getAllInvestors);
router.get('/entrepreneurs', protect, getAllEntrepreneurs);
router.get('/:id', protect, getProfile);
router.put('/update', protect, upload.single('avatar'), updateProfile);

module.exports = router;