const User = require('../models/User');

// @route GET /api/profile/:id
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/profile/update
exports.updateProfile = async (req, res) => {
  try {
    const {
      name, bio, location, phone,
      startupName, startupStage, fundingNeeded, industry, pitch,
      investmentRange, preferredIndustries, portfolioSize
    } = req.body;

    const updateData = {
      name, bio, location, phone,
      startupName, startupStage, fundingNeeded, industry, pitch,
      investmentRange, preferredIndustries, portfolioSize
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // Handle avatar upload
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/profile/investors
exports.getAllInvestors = async (req, res) => {
  try {
    const investors = await User.find({ role: 'investor' }).select('-password');
    res.json({ success: true, investors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/profile/entrepreneurs
exports.getAllEntrepreneurs = async (req, res) => {
  try {
    const entrepreneurs = await User.find({ role: 'entrepreneur' }).select('-password');
    res.json({ success: true, entrepreneurs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};