const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Common fields
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['participant', 'organizer', 'admin'],
        required: true
    },

    // Participant-specific fields
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    participantType: {
        type: String,
        enum: ['iiit', 'non-iiit'],
    },
    college: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    interests: [{ type: String }],
    followedOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    onboardingComplete: { type: Boolean, default: false },

    // Organizer-specific fields
    organizerName: { type: String, trim: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    discordWebhook: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
