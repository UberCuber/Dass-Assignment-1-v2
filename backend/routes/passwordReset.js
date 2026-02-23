const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    requestPasswordReset, getPasswordResetRequests,
    reviewPasswordResetRequest, getMyPasswordResetRequests
} = require('../controllers/adminController');

router.post('/request', protect, authorize('organizer'), requestPasswordReset);
router.get('/my-requests', protect, authorize('organizer'), getMyPasswordResetRequests);
router.get('/requests', protect, authorize('admin'), getPasswordResetRequests);
router.put('/requests/:id', protect, authorize('admin'), reviewPasswordResetRequest);

module.exports = router;
