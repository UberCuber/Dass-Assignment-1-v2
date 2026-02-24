const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Allowed origins
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .concat(['http://localhost:5173', 'http://localhost:5174']);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true
};

// Socket.IO setup
const io = new Server(server, { cors: corsOptions });

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/password-reset', require('./routes/passwordReset'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/messages', require('./routes/messages'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== SOCKET.IO - Real-Time Discussion Forum ====================
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return next(new Error('User not found'));

        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    // Join event discussion room
    socket.on('join-event', (eventId) => {
        socket.join(`event-${eventId}`);
        console.log(`${socket.user.email} joined event-${eventId}`);
    });

    // Leave event discussion room
    socket.on('leave-event', (eventId) => {
        socket.leave(`event-${eventId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
        try {
            const message = await Message.create({
                event: data.eventId,
                author: socket.user._id,
                content: data.content,
                parentMessage: data.parentMessage || null,
                isAnnouncement: data.isAnnouncement || false
            });

            const populated = await Message.findById(message._id)
                .populate('author', 'firstName lastName organizerName role email');

            io.to(`event-${data.eventId}`).emit('new-message', populated);
        } catch (error) {
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Pin message (organizer only)
    socket.on('pin-message', async (data) => {
        try {
            if (socket.user.role !== 'organizer') return;
            const message = await Message.findByIdAndUpdate(
                data.messageId,
                { isPinned: !data.currentPinned },
                { new: true }
            ).populate('author', 'firstName lastName organizerName role email');

            io.to(`event-${data.eventId}`).emit('message-updated', message);
        } catch (error) {
            socket.emit('error', { message: 'Failed to pin message' });
        }
    });

    // Delete message (organizer only)
    socket.on('delete-message', async (data) => {
        try {
            if (socket.user.role !== 'organizer') return;
            await Message.findByIdAndUpdate(data.messageId, { isDeleted: true });
            io.to(`event-${data.eventId}`).emit('message-deleted', data.messageId);
        } catch (error) {
            socket.emit('error', { message: 'Failed to delete message' });
        }
    });

    // React to message
    socket.on('react-message', async (data) => {
        try {
            const message = await Message.findById(data.messageId);
            if (!message) return;

            const reactionIndex = message.reactions.findIndex(r => r.emoji === data.emoji);
            if (reactionIndex > -1) {
                const userIndex = message.reactions[reactionIndex].users.indexOf(socket.user._id);
                if (userIndex > -1) {
                    message.reactions[reactionIndex].users.splice(userIndex, 1);
                    if (message.reactions[reactionIndex].users.length === 0) {
                        message.reactions.splice(reactionIndex, 1);
                    }
                } else {
                    message.reactions[reactionIndex].users.push(socket.user._id);
                }
            } else {
                message.reactions.push({ emoji: data.emoji, users: [socket.user._id] });
            }

            await message.save();
            const populated = await Message.findById(message._id)
                .populate('author', 'firstName lastName organizerName role email');

            io.to(`event-${data.eventId}`).emit('message-updated', populated);
        } catch (error) {
            socket.emit('error', { message: 'Failed to react' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.email}`);
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
