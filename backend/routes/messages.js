const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// @desc    Get messages for an event
// @route   GET /api/messages/:eventId
router.get('/:eventId', protect, async (req, res) => {
    try {
        const { page = 1, limit = 50, pinned } = req.query;
        let query = { event: req.params.eventId, isDeleted: false };

        if (pinned === 'true') query.isPinned = true;

        const messages = await Message.find(query)
            .populate('author', 'firstName lastName organizerName role email')
            .populate('parentMessage', 'content author')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Message.countDocuments(query);

        res.json({ messages: messages.reverse(), total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
