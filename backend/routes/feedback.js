const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { submitFeedback, getEventFeedback } = require('../controllers/feedbackController');

router.post('/:eventId', protect, authorize('participant'), submitFeedback);
router.get('/:eventId', protect, getEventFeedback);

module.exports = router;
