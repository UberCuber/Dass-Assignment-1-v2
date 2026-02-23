const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');

// @desc    Submit feedback for an event
// @route   POST /api/feedback/:eventId
const submitFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        // Check if participant attended the event
        const registration = await Registration.findOne({
            participant: req.user._id,
            event: req.params.eventId,
            status: { $in: ['registered', 'approved', 'completed'] }
        });

        if (!registration) {
            return res.status(403).json({ message: 'You must have attended this event to leave feedback' });
        }

        // Check for existing feedback
        const existing = await Feedback.findOne({
            event: req.params.eventId,
            participant: req.user._id
        });

        if (existing) {
            return res.status(400).json({ message: 'You have already submitted feedback for this event' });
        }

        const feedback = await Feedback.create({
            event: req.params.eventId,
            participant: req.user._id,
            rating,
            comment
        });

        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get feedback for an event (organizer view)
// @route   GET /api/feedback/:eventId
const getEventFeedback = async (req, res) => {
    try {
        const { rating } = req.query;
        let query = { event: req.params.eventId };
        if (rating) query.rating = parseInt(rating);

        const feedbacks = await Feedback.find(query)
            .sort({ createdAt: -1 });

        // Calculate aggregated stats
        const allFeedbacks = await Feedback.find({ event: req.params.eventId });
        const totalFeedbacks = allFeedbacks.length;
        const averageRating = totalFeedbacks > 0
            ? (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1)
            : 0;

        const ratingDistribution = [1, 2, 3, 4, 5].map(r => ({
            rating: r,
            count: allFeedbacks.filter(f => f.rating === r).length
        }));

        res.json({
            feedbacks,
            stats: {
                totalFeedbacks,
                averageRating: parseFloat(averageRating),
                ratingDistribution
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { submitFeedback, getEventFeedback };
