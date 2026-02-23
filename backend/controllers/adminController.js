const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const crypto = require('crypto');

// ==================== ADMIN CONTROLLERS ====================

// @desc    Create organizer account
// @route   POST /api/admin/organizers
const createOrganizer = async (req, res) => {
    try {
        const { organizerName, category, description, contactEmail } = req.body;

        // Auto-generate email and password
        const slug = organizerName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const generatedEmail = contactEmail || `${slug}@felicity.org`;
        const generatedPassword = crypto.randomBytes(6).toString('hex'); // 12 char random password

        // Check if email already exists
        const existing = await User.findOne({ email: generatedEmail });
        if (existing) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const organizer = await User.create({
            email: generatedEmail,
            password: generatedPassword,
            role: 'organizer',
            organizerName,
            category,
            description,
            contactEmail: contactEmail || generatedEmail,
            isActive: true
        });

        res.status(201).json({
            _id: organizer._id,
            organizerName: organizer.organizerName,
            email: organizer.email,
            generatedPassword, // Admin sees this to share with organizer
            category: organizer.category,
            description: organizer.description,
            contactEmail: organizer.contactEmail,
            message: 'Organizer account created. Share these credentials with the organizer.'
        });
    } catch (error) {
        console.error('Create organizer error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all organizers
// @route   GET /api/admin/organizers
const getAllOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'organizer' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Remove/Disable organizer
// @route   DELETE /api/admin/organizers/:id
const removeOrganizer = async (req, res) => {
    try {
        const { action } = req.query; // 'archive' or 'delete'
        const organizer = await User.findById(req.params.id);

        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        if (action === 'delete') {
            await User.findByIdAndDelete(req.params.id);
            res.json({ message: 'Organizer permanently deleted' });
        } else {
            organizer.isActive = false;
            organizer.isArchived = true;
            await organizer.save();
            res.json({ message: 'Organizer archived and disabled' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Reactivate organizer
// @route   PUT /api/admin/organizers/:id/reactivate
const reactivateOrganizer = async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id);
        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        organizer.isActive = true;
        organizer.isArchived = false;
        await organizer.save();
        res.json({ message: 'Organizer reactivated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==================== PASSWORD RESET CONTROLLERS ====================

// @desc    Organizer requests password reset
// @route   POST /api/password-reset/request
const requestPasswordReset = async (req, res) => {
    try {
        const { reason } = req.body;

        // Check for existing pending request
        const existing = await PasswordResetRequest.findOne({
            organizer: req.user._id,
            status: 'pending'
        });
        if (existing) {
            return res.status(400).json({ message: 'You already have a pending password reset request' });
        }

        const request = await PasswordResetRequest.create({
            organizer: req.user._id,
            reason
        });

        res.status(201).json({ message: 'Password reset request submitted', request });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all password reset requests (admin)
// @route   GET /api/password-reset/requests
const getPasswordResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find()
            .populate('organizer', 'organizerName email category')
            .populate('reviewedBy', 'email')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Approve/Reject password reset request (admin)
// @route   PUT /api/password-reset/requests/:id
const reviewPasswordResetRequest = async (req, res) => {
    try {
        const { action, comment } = req.body;
        const request = await PasswordResetRequest.findById(req.params.id)
            .populate('organizer', 'organizerName email');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request has already been reviewed' });
        }

        if (action === 'approve') {
            // Generate new password
            const newPassword = crypto.randomBytes(6).toString('hex');

            // Update organizer's password
            const organizer = await User.findById(request.organizer._id);
            organizer.password = newPassword;
            await organizer.save();

            request.status = 'approved';
            request.newPassword = newPassword; // Admin can view and share
            request.adminComment = comment;
            request.reviewedBy = req.user._id;
            request.reviewedAt = new Date();
            await request.save();

            res.json({
                message: 'Password reset approved',
                newPassword,
                organizerName: request.organizer.organizerName,
                organizerEmail: request.organizer.email
            });
        } else if (action === 'reject') {
            request.status = 'rejected';
            request.adminComment = comment;
            request.reviewedBy = req.user._id;
            request.reviewedAt = new Date();
            await request.save();

            res.json({ message: 'Password reset request rejected' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get password reset history for organizer
// @route   GET /api/password-reset/my-requests
const getMyPasswordResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({ organizer: req.user._id })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==================== USER LISTING CONTROLLERS ====================

// @desc    Get all organizers (public - for participants)
// @route   GET /api/users/organizers
const getOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'organizer', isActive: true, isArchived: false })
            .select('organizerName category description contactEmail')
            .sort({ organizerName: 1 });
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get organizer details with events
// @route   GET /api/users/organizers/:id
const getOrganizerDetails = async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id)
            .select('organizerName category description contactEmail');

        if (!organizer || organizer.role === undefined) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        const upcomingEvents = await Event.find({
            organizer: req.params.id,
            status: { $in: ['published', 'ongoing'] },
            startDate: { $gte: new Date() }
        }).sort({ startDate: 1 });

        const pastEvents = await Event.find({
            organizer: req.params.id,
            status: { $in: ['completed', 'closed'] }
        }).sort({ endDate: -1 });

        res.json({ organizer, upcomingEvents, pastEvents });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Follow/Unfollow organizer
// @route   POST /api/users/organizers/:id/follow
const toggleFollowOrganizer = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const organizerId = req.params.id;

        const isFollowing = user.followedOrganizers.includes(organizerId);

        if (isFollowing) {
            user.followedOrganizers = user.followedOrganizers.filter(
                id => id.toString() !== organizerId
            );
        } else {
            user.followedOrganizers.push(organizerId);
        }

        await user.save();
        res.json({
            following: !isFollowing,
            followedOrganizers: user.followedOrganizers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get dashboard stats (admin)
// @route   GET /api/admin/stats
const getAdminStats = async (req, res) => {
    try {
        const totalParticipants = await User.countDocuments({ role: 'participant' });
        const totalOrganizers = await User.countDocuments({ role: 'organizer' });
        const totalEvents = await Event.countDocuments();
        const totalRegistrations = await Registration.countDocuments();
        const activeEvents = await Event.countDocuments({ status: { $in: ['published', 'ongoing'] } });
        const pendingResets = await PasswordResetRequest.countDocuments({ status: 'pending' });

        res.json({
            totalParticipants,
            totalOrganizers,
            totalEvents,
            totalRegistrations,
            activeEvents,
            pendingResets
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createOrganizer,
    getAllOrganizers,
    removeOrganizer,
    reactivateOrganizer,
    requestPasswordReset,
    getPasswordResetRequests,
    reviewPasswordResetRequest,
    getMyPasswordResetRequests,
    getOrganizers,
    getOrganizerDetails,
    toggleFollowOrganizer,
    getAdminStats
};
