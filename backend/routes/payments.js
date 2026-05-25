const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  deposit,
  confirmDeposit,
  withdraw,
  transfer,
  getHistory
} = require('../controllers/paymentController');

router.post('/deposit', protect, deposit);
router.post('/deposit/confirm', protect, confirmDeposit);
router.post('/withdraw', protect, withdraw);
router.post('/transfer', protect, transfer);
router.get('/history', protect, getHistory);

module.exports = router;