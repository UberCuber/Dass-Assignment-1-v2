const mongoose = require('mongoose');

// Sub-schema for custom form fields (form builder)
const formFieldSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: {
        type: String,
        enum: ['text', 'textarea', 'dropdown', 'checkbox', 'radio', 'file', 'number', 'email', 'date'],
        required: true
    },
    required: { type: Boolean, default: false },
    options: [String], // For dropdown, radio, checkbox
    order: { type: Number, default: 0 },
    placeholder: { type: String }
}, { _id: true });

// Sub-schema for merchandise variants
const merchandiseVariantSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Size"
    options: [String] // e.g., ["S", "M", "L", "XL"]
}, { _id: true });

const merchandiseItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    purchaseLimit: { type: Number, default: 1 },
    variants: [merchandiseVariantSchema],
    image: { type: String }
}, { _id: true });

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['normal', 'merchandise'],
        required: true
    },
    eligibility: {
        type: String,
        enum: ['all', 'iiit', 'non-iiit'],
        default: 'all'
    },
    registrationDeadline: {
        type: Date,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    registrationLimit: {
        type: Number,
        default: 0 // 0 = unlimited
    },
    registrationFee: {
        type: Number,
        default: 0
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{ type: String }],
    status: {
        type: String,
        enum: ['draft', 'published', 'ongoing', 'completed', 'closed'],
        default: 'draft'
    },
    registrationCount: {
        type: Number,
        default: 0
    },

    // Normal event: custom form
    customForm: [formFieldSchema],
    formLocked: { type: Boolean, default: false },

    // Merchandise event: items
    merchandiseItems: [merchandiseItemSchema],

    // Analytics
    totalRevenue: { type: Number, default: 0 },

    // Discussion forum
    discussionEnabled: { type: Boolean, default: true },

}, { timestamps: true });

// Index for search
eventSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Event', eventSchema);
