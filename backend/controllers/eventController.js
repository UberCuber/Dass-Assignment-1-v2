const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { v4: uuidv4 } = require('uuid');
const generateQRCode = require('../utils/qrCode');
const { sendTicketEmail } = require('../utils/email');


// @desc    Create a new event
// @route   POST /api/events
const createEvent = async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            organizer: req.user._id,
            status: 'draft'
        };

        const event = await Event.create(eventData);
        res.status(201).json(event);
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all events (with search, filter, trending)
// @route   GET /api/events
const getEvents = async (req, res) => {
    try {
        const { search, type, eligibility, startDate, endDate, organizer, status, followed, trending, page = 1, limit = 20 } = req.query;

        let query = { status: { $in: ['published', 'ongoing'] } };

        // If organizer is requesting their own events, show all statuses
        if (req.user && req.user.role === 'organizer') {
            if (req.query.myEvents === 'true') {
                query = { organizer: req.user._id };
            }
        }

        // Admin can see all events
        if (req.user && req.user.role === 'admin') {
            delete query.status;
        }

        // Search (fuzzy)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // Filters
        if (type) query.type = type;
        if (eligibility) query.eligibility = eligibility;
        if (status && (req.user?.role === 'organizer' || req.user?.role === 'admin')) {
            query.status = status;
        }
        if (organizer) query.organizer = organizer;

        // Date range filter
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        // Followed clubs filter
        if (followed === 'true' && req.user) {
            const User = require('../models/User');
            const currentUser = await User.findById(req.user._id);
            if (currentUser.followedOrganizers && currentUser.followedOrganizers.length > 0) {
                query.organizer = { $in: currentUser.followedOrganizers };
            }
        }

        // Trending: top 5 by registration count in last 24h
        if (trending === 'true') {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const trendingEvents = await Registration.aggregate([
                { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
                { $group: { _id: '$event', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            const trendingIds = trendingEvents.map(e => e._id);
            if (trendingIds.length > 0) {
                query._id = { $in: trendingIds };
            }

            const events = await Event.find(query)
                .populate('organizer', 'organizerName category')
                .sort({ registrationCount: -1 })
                .limit(5);

            return res.json({ events, total: events.length, page: 1, pages: 1 });
        }

        const total = await Event.countDocuments(query);
        const events = await Event.find(query)
            .populate('organizer', 'organizerName category')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            events,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
const getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'organizerName category description contactEmail');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check ownership
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to edit this event' });
        }

        // Enforce editing rules based on status
        const { status } = event;
        const updates = req.body;

        if (status === 'ongoing' || status === 'completed') {
            // Only allow status change
            if (Object.keys(updates).length > 1 || !updates.status) {
                return res.status(400).json({
                    message: 'Ongoing/Completed events can only have their status changed'
                });
            }
        }

        if (status === 'published') {
            // Only allow: description update, extend deadline, increase limit, close registrations
            const allowedFields = ['description', 'registrationDeadline', 'registrationLimit', 'status'];
            const invalidFields = Object.keys(updates).filter(f => !allowedFields.includes(f));
            if (invalidFields.length > 0) {
                return res.status(400).json({
                    message: `Published events cannot modify: ${invalidFields.join(', ')}`
                });
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('organizer', 'organizerName category');

        // If publishing, send Discord webhook notification
        if (updates.status === 'published' && status === 'draft') {
            const User = require('../models/User');
            const orgUser = await User.findById(event.organizer);
            if (orgUser && orgUser.discordWebhook) {
                try {
                    await fetch(orgUser.discordWebhook, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: null,
                            embeds: [{
                                title: `🎉 New Event: ${updatedEvent.name}`,
                                description: updatedEvent.description?.substring(0, 200) + '...',
                                color: 7506394,
                                fields: [
                                    { name: 'Type', value: updatedEvent.type, inline: true },
                                    { name: 'Date', value: new Date(updatedEvent.startDate).toLocaleDateString(), inline: true },
                                    { name: 'Fee', value: updatedEvent.registrationFee > 0 ? `₹${updatedEvent.registrationFee}` : 'Free', inline: true }
                                ]
                            }]
                        })
                    });
                } catch (webhookErr) {
                    console.log('Discord webhook failed (non-critical):', webhookErr.message);
                }
            }
        }

        res.json(updatedEvent);
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
const registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Validations
        if (event.status !== 'published' && event.status !== 'ongoing') {
            return res.status(400).json({ message: 'Event is not open for registration' });
        }

        if (new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({ message: 'Registration deadline has passed' });
        }

        if (event.registrationLimit > 0 && event.registrationCount >= event.registrationLimit) {
            return res.status(400).json({ message: 'Registration limit reached' });
        }

        // Eligibility check
        if (event.eligibility !== 'all') {
            const User = require('../models/User');
            const participant = await User.findById(req.user._id);
            if (participant.participantType !== event.eligibility) {
                return res.status(403).json({ message: `This event is only for ${event.eligibility} participants` });
            }
        }

        // Check existing registration
        const existingReg = await Registration.findOne({
            participant: req.user._id,
            event: event._id
        });
        if (existingReg) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        // Merchandise stock check
        if (event.type === 'merchandise' && req.body.merchandiseSelections) {
            for (const selection of req.body.merchandiseSelections) {
                const item = event.merchandiseItems.id(selection.itemId);
                if (!item) {
                    return res.status(400).json({ message: `Item not found: ${selection.itemId}` });
                }
                if (item.stock < selection.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for ${item.itemName}` });
                }
                if (selection.quantity > item.purchaseLimit) {
                    return res.status(400).json({ message: `Max purchase limit for ${item.itemName} is ${item.purchaseLimit}` });
                }
            }
        }

        // Generate ticket
        const ticketId = 'FEL-' + uuidv4().substring(0, 8).toUpperCase();
        const User = require('../models/User');
        const participant = await User.findById(req.user._id);

        const qrData = {
            ticketId,
            eventId: event._id,
            eventName: event.name,
            participantId: req.user._id,
            participantName: `${participant.firstName} ${participant.lastName}`,
            type: event.type
        };
        const qrCode = await generateQRCode(qrData);

        // Calculate total amount
        let totalAmount = event.registrationFee || 0;
        if (event.type === 'merchandise' && req.body.merchandiseSelections) {
            for (const selection of req.body.merchandiseSelections) {
                const item = event.merchandiseItems.id(selection.itemId);
                totalAmount += item.price * selection.quantity;
            }
        }

        // Determine initial status
        let regStatus = 'registered';
        let paymentStatus = 'not_required';

        // For merchandise with payment approval workflow
        if (event.type === 'merchandise' && req.body.paymentProof) {
            regStatus = 'pending_payment';
            paymentStatus = 'pending';
        }

        const registration = await Registration.create({
            participant: req.user._id,
            event: event._id,
            status: regStatus,
            formResponses: req.body.formResponses || [],
            merchandiseSelections: req.body.merchandiseSelections || [],
            ticketId,
            qrCode: regStatus === 'registered' ? qrCode : undefined, // No QR for pending payments
            paymentProof: req.body.paymentProof,
            paymentStatus,
            totalAmount
        });

        // Update event counts
        event.registrationCount += 1;
        event.totalRevenue += totalAmount;

        // Decrement merchandise stock (only if not pending payment)
        if (event.type === 'merchandise' && regStatus === 'registered' && req.body.merchandiseSelections) {
            for (const selection of req.body.merchandiseSelections) {
                const item = event.merchandiseItems.id(selection.itemId);
                item.stock -= selection.quantity;
            }
        }

        await event.save();

        // Send email (non-blocking, only if registration is confirmed)
        if (regStatus === 'registered') {
            sendTicketEmail(participant.email, {
                eventName: event.name,
                participantName: `${participant.firstName} ${participant.lastName}`,
                ticketId,
                qrCode,
                eventDate: event.startDate,
                eventType: event.type
            }).catch(err => console.log('Email failed (non-critical):', err.message));
        }

        res.status(201).json(registration);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get registrations for an event (organizer)
// @route   GET /api/events/:id/registrations
const getEventRegistrations = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Only organizer who owns the event or admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { search, status, page = 1, limit = 50 } = req.query;
        let query = { event: event._id };

        if (status) query.status = status;

        const registrations = await Registration.find(query)
            .populate('participant', 'firstName lastName email contactNumber college participantType')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        let filtered = registrations;
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = registrations.filter(r =>
                r.participant.firstName?.toLowerCase().includes(searchLower) ||
                r.participant.lastName?.toLowerCase().includes(searchLower) ||
                r.participant.email?.toLowerCase().includes(searchLower)
            );
        }

        const total = await Registration.countDocuments(query);

        res.json({ registrations: filtered, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get user's registrations (my events)
// @route   GET /api/events/my-registrations
const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ participant: req.user._id })
            .populate({
                path: 'event',
                populate: { path: 'organizer', select: 'organizerName category' }
            })
            .sort({ createdAt: -1 });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Approve/Reject payment (organizer)
// @route   PUT /api/events/:id/registrations/:regId/payment
const reviewPayment = async (req, res) => {
    try {
        const { action, comment } = req.body; // action: 'approve' or 'reject'
        const registration = await Registration.findById(req.params.regId)
            .populate('participant', 'firstName lastName email')
            .populate('event');

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const event = await Event.findById(registration.event._id);
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (action === 'approve') {
            registration.paymentStatus = 'approved';
            registration.status = 'approved';
            registration.paymentReviewedBy = req.user._id;
            registration.paymentReviewedAt = new Date();
            registration.paymentReviewComment = comment;

            // Generate QR code now
            const qrData = {
                ticketId: registration.ticketId,
                eventId: event._id,
                eventName: event.name,
                participantId: registration.participant._id,
                participantName: `${registration.participant.firstName} ${registration.participant.lastName}`
            };
            registration.qrCode = await generateQRCode(qrData);

            // Decrement stock
            if (registration.merchandiseSelections) {
                for (const selection of registration.merchandiseSelections) {
                    const item = event.merchandiseItems.id(selection.itemId);
                    if (item) item.stock -= selection.quantity;
                }
                await event.save();
            }

            // Send confirmation email
            sendTicketEmail(registration.participant.email, {
                eventName: event.name,
                participantName: `${registration.participant.firstName} ${registration.participant.lastName}`,
                ticketId: registration.ticketId,
                qrCode: registration.qrCode,
                eventDate: event.startDate,
                eventType: event.type
            }).catch(err => console.log('Email failed:', err.message));

        } else if (action === 'reject') {
            registration.paymentStatus = 'rejected';
            registration.status = 'rejected';
            registration.paymentReviewedBy = req.user._id;
            registration.paymentReviewedAt = new Date();
            registration.paymentReviewComment = comment;
        }

        await registration.save();
        res.json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Mark attendance (QR scan)
// @route   POST /api/events/:id/attendance
const markAttendance = async (req, res) => {
    try {
        const { ticketId } = req.body;

        const registration = await Registration.findOne({ ticketId, event: req.params.id })
            .populate('participant', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ message: 'Invalid ticket' });
        }

        if (registration.attended) {
            return res.status(400).json({
                message: 'Attendance already marked',
                attendedAt: registration.attendedAt
            });
        }

        if (registration.status !== 'registered' && registration.status !== 'approved') {
            return res.status(400).json({ message: 'Registration is not confirmed' });
        }

        registration.attended = true;
        registration.attendedAt = new Date();
        registration.attendanceMarkedBy = req.user._id;
        await registration.save();

        res.json({
            message: 'Attendance marked successfully',
            participant: registration.participant,
            ticketId: registration.ticketId,
            attendedAt: registration.attendedAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get attendance stats for event
// @route   GET /api/events/:id/attendance
const getAttendanceStats = async (req, res) => {
    try {
        const total = await Registration.countDocuments({
            event: req.params.id,
            status: { $in: ['registered', 'approved'] }
        });
        const attended = await Registration.countDocuments({
            event: req.params.id,
            attended: true
        });

        const attendees = await Registration.find({ event: req.params.id, attended: true })
            .populate('participant', 'firstName lastName email')
            .select('ticketId attendedAt participant')
            .sort({ attendedAt: -1 });

        res.json({ total, attended, notAttended: total - attended, attendees });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get event analytics (organizer)
// @route   GET /api/events/:id/analytics
const getEventAnalytics = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const totalRegistrations = await Registration.countDocuments({ event: event._id });
        const confirmedRegistrations = await Registration.countDocuments({
            event: event._id,
            status: { $in: ['registered', 'approved'] }
        });
        const attended = await Registration.countDocuments({ event: event._id, attended: true });
        const pendingPayments = await Registration.countDocuments({
            event: event._id,
            paymentStatus: 'pending'
        });

        const revenueAgg = await Registration.aggregate([
            { $match: { event: event._id, status: { $in: ['registered', 'approved'] } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        res.json({
            totalRegistrations,
            confirmedRegistrations,
            attended,
            pendingPayments,
            totalRevenue,
            registrationLimit: event.registrationLimit,
            status: event.status
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Export registrations as CSV
// @route   GET /api/events/:id/export
const exportRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ event: req.params.id })
            .populate('participant', 'firstName lastName email contactNumber college participantType');

        const csvRows = [
            ['Name', 'Email', 'Contact', 'College', 'Type', 'Status', 'Ticket ID', 'Attended', 'Registered At'].join(',')
        ];

        registrations.forEach(r => {
            csvRows.push([
                `${r.participant.firstName} ${r.participant.lastName}`,
                r.participant.email,
                r.participant.contactNumber || '',
                r.participant.college || '',
                r.participant.participantType,
                r.status,
                r.ticketId,
                r.attended ? 'Yes' : 'No',
                new Date(r.createdAt).toISOString()
            ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=registrations-${req.params.id}.csv`);
        res.send(csvRows.join('\n'));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    registerForEvent,
    getEventRegistrations,
    getMyRegistrations,
    reviewPayment,
    markAttendance,
    getAttendanceStats,
    getEventAnalytics,
    exportRegistrations
};
