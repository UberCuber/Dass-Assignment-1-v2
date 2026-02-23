const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getOrganizers, getOrganizerDetails, toggleFollowOrganizer } = require('../controllers/adminController');

router.get('/organizers', protect, getOrganizers);
router.get('/organizers/:id', protect, getOrganizerDetails);
router.post('/organizers/:id/follow', protect, authorize('participant'), toggleFollowOrganizer);

module.exports = router;
