const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    createEvent, getEvents, getEvent, updateEvent,
    registerForEvent, getEventRegistrations, getMyRegistrations,
    reviewPayment, markAttendance, getAttendanceStats,
    getEventAnalytics, exportRegistrations
} = require('../controllers/eventController');

// Public / Participant routes
router.get('/', protect, getEvents);
router.get('/my-registrations', protect, authorize('participant'), getMyRegistrations);
router.get('/:id', protect, getEvent);
router.post('/:id/register', protect, authorize('participant'), upload.single('paymentProof'), registerForEvent);

// Organizer routes
router.post('/', protect, authorize('organizer'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.get('/:id/registrations', protect, authorize('organizer', 'admin'), getEventRegistrations);
router.put('/:id/registrations/:regId/payment', protect, authorize('organizer'), reviewPayment);
router.get('/:id/analytics', protect, authorize('organizer', 'admin'), getEventAnalytics);
router.get('/:id/export', protect, authorize('organizer', 'admin'), exportRegistrations);

// Attendance (organizer)
router.post('/:id/attendance', protect, authorize('organizer'), markAttendance);
router.get('/:id/attendance', protect, authorize('organizer', 'admin'), getAttendanceStats);

module.exports = router;
