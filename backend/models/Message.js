const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    parentMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    isPinned: { type: Boolean, default: false },
    isAnnouncement: { type: Boolean, default: false },
    reactions: [{
        emoji: String,
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
