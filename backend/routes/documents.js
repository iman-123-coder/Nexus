const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  shareDocument,
  signDocument,
  updateDocument,
  deleteDocument
} = require('../controllers/documentController');

router.post('/upload', protect, upload.single('document'), uploadDocument);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocument);
router.put('/:id/share', protect, shareDocument);
router.put('/:id/sign', protect, signDocument);
router.put('/:id/update', protect, upload.single('document'), updateDocument);
router.delete('/:id', protect, deleteDocument);

module.exports = router;