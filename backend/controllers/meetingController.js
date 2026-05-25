const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { sendMeetingEmail } = require('../utils/email');

// @route POST /api/meetings/create
exports.createMeeting = async (req, res) => {
  try {
    const { title, description, participantId, date, duration } = req.body;

    // Check for scheduling conflicts
    const conflict = await Meeting.findOne({
      $or: [
        { organizer: req.user.id },
        { participant: req.user.id }
      ],
      date: {
        $gte: new Date(new Date(date) - duration * 60000),
        $lte: new Date(new Date(date).getTime() + duration * 60000)
      },
      status: 'accepted'
    });

    if (conflict) {
      return res.status(400).json({ success: false, message: 'Scheduling conflict detected' });
    }

    const meeting = await Meeting.create({
      title,
      description,
      organizer: req.user.id,
      participant: participantId,
      date,
      duration,
      roomId: uuidv4()
    });

    // Send email to participant
    const participant = await User.findById(participantId);
    if (participant) {
      await sendMeetingEmail(participant.email, {
        title,
        date,
        duration,
        status: 'scheduled',
        notes: description
      });
    }

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/meetings
exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { organizer: req.user.id },
        { participant: req.user.id }
      ]
    })
    .populate('organizer', 'name email avatar')
    .populate('participant', 'name email avatar')
    .sort({ date: -1 });

    res.json({ success: true, meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/meetings/:id/status
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('participant', 'name email');

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    meeting.status = status;
    await meeting.save();

    // Send email to organizer
    await sendMeetingEmail(meeting.organizer.email, {
      title: meeting.title,
      date: meeting.date,
      duration: meeting.duration,
      status
    });

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/meetings/:id
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    if (meeting.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await meeting.deleteOne();
    res.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/meetings/:id
exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name email avatar')
      .populate('participant', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};