const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const otp = generateOTP();
    const user = await User.create({
      name, email, password, role,
      otpCode: otp,
      otpExpire: new Date(Date.now() + 10 * 60 * 1000)
    });
    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr) {
      console.log(`OTP for ${email}: ${otp}`);
    }
    res.status(201).json({ success: true, message: 'OTP sent to email', userId: user._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.otpCode !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    await User.updateOne({ _id: userId }, {
      $set: { isVerified: true },
      $unset: { otpCode: 1, otpExpire: 1 }
    });
    const token = generateToken(user._id);
    const freshUser = await User.findById(user._id).select('-password');
    res.json({ success: true, token, user: freshUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email first' });
    }
    const token = generateToken(user._id);
    const freshUser = await User.findById(user._id).select('-password');
    res.json({ success: true, token, user: freshUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const otp = generateOTP();
    await User.updateOne({ _id: user._id }, {
      $set: { otpCode: otp, otpExpire: new Date(Date.now() + 10 * 60 * 1000) }
    });
    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr) {
      console.log(`Reset OTP for ${email}: ${otp}`);
    }
    res.json({ success: true, message: 'OTP sent to email', userId: user._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.otpCode !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};