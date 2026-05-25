const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const {
  getProfile,
  updateProfile,
  getAllInvestors,
  getAllEntrepreneurs
} = require('../controllers/profileController');

// List routes
router.get('/investors', protect, getAllInvestors);
router.get('/entrepreneurs', protect, getAllEntrepreneurs);

// Avatar upload
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Profile update (no file)
router.put('/update', protect, updateProfile);

// Get profile by ID — must be last to avoid catching /investors etc.
router.get('/:id', protect, getProfile);

module.exports = router;