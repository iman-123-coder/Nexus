const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');

// GET /api/messages — get all conversations (last message per user)
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
    .populate('sender', 'name avatar role')
    .populate('receiver', 'name avatar role')
    .sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const senderId = msg.sender._id.toString();
      const receiverId = msg.receiver._id.toString();
      const otherId = senderId === userId ? receiverId : senderId;

      if (!seen.has(otherId)) {
        seen.add(otherId);
        const other = senderId === userId ? msg.receiver : msg.sender;
        conversations.push({ user: other, lastMessage: msg });
      }
    }

    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/messages/:userId — get conversation with a specific user
router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/messages — save a message
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content
    });
    const populated = await message.populate([
      { path: 'sender', select: 'name avatar' },
      { path: 'receiver', select: 'name avatar' }
    ]);
    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;