const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    status: {
        type: String,
        enum: ['registered', 'pending_payment', 'approved', 'rejected', 'cancelled', 'completed'],
        default: 'registered'
    },

    // Custom form responses (for normal events)
    formResponses: [{
        fieldId: { type: mongoose.Schema.Types.ObjectId },
        label: { type: String },
        value: { type: mongoose.Schema.Types.Mixed }
    }],

    // Merchandise selections
    merchandiseSelections: [{
        itemId: { type: mongoose.Schema.Types.ObjectId },
        itemName: { type: String },
        quantity: { type: Number, default: 1 },
        selectedVariants: { type: Map, of: String }, // e.g., { "Size": "L", "Color": "Black" }
        price: { type: Number }
    }],

    // Payment (for merchandise payment approval workflow)
    paymentProof: { type: String }, // URL/path to uploaded image
    paymentStatus: {
        type: String,
        enum: ['not_required', 'pending', 'approved', 'rejected'],
        default: 'not_required'
    },
    paymentReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentReviewedAt: { type: Date },
    paymentReviewComment: { type: String },

    // Ticket
    ticketId: {
        type: String,
        unique: true,
        sparse: true
    },
    qrCode: { type: String }, // Base64 QR code image

    // Attendance tracking
    attended: { type: Boolean, default: false },
    attendedAt: { type: Date },
    attendanceMarkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    totalAmount: { type: Number, default: 0 },

}, { timestamps: true });

// Compound index: one registration per participant per event
registrationSchema.index({ participant: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
