const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeetingStatus,
  deleteMeeting
} = require('../controllers/meetingController');

router.post('/create', protect, createMeeting);
router.get('/', protect, getMeetings);
router.get('/:id', protect, getMeeting);
router.put('/:id/status', protect, updateMeetingStatus);
router.delete('/:id', protect, deleteMeeting);

module.exports = router;