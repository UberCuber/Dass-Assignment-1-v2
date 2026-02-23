const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createOrganizer, getAllOrganizers, removeOrganizer, reactivateOrganizer,
    getAdminStats
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.post('/organizers', createOrganizer);
router.get('/organizers', getAllOrganizers);
router.delete('/organizers/:id', removeOrganizer);
router.put('/organizers/:id/reactivate', reactivateOrganizer);

module.exports = router;
