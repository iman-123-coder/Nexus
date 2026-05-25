const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['entrepreneur', 'investor'], required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  startupName: { type: String, default: '' },
  startupStage: { type: String, default: '' },
  fundingNeeded: { type: Number, default: 0 },
  industry: { type: String, default: '' },
  pitch: { type: String, default: '' },
  investmentRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  preferredIndustries: [{ type: String }],
  portfolioSize: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  otpCode: { type: String },
  otpExpire: { type: Date },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.pre('save', async function() {
  console.log('[PRE-SAVE] Hook triggered');
  console.log('[PRE-SAVE] isModified password:', this.isModified('password'));
  
  if (!this.isModified('password')) {
    console.log('[PRE-SAVE] Password not modified, skipping hash');
    return;
  }
  
  console.log('[PRE-SAVE] Hashing password...');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log('[PRE-SAVE] Password hashed successfully');
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('[matchPassword] Comparing passwords...');
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
console.log('[User model] Loaded successfully');