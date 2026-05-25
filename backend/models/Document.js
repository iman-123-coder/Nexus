const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  filesize: { type: Number },
  mimetype: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  signature: { type: String, default: '' },
  isSigned: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  previousVersions: [{ filepath: String, version: Number, date: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);