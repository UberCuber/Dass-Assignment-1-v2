const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new participant
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, participantType, college, contactNumber } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // IIIT email validation
        if (participantType === 'iiit') {
            const iiitDomains = ['iiit.ac.in', 'students.iiit.ac.in', 'research.iiit.ac.in'];
            const emailDomain = email.split('@')[1];
            if (!iiitDomains.includes(emailDomain)) {
                return res.status(400).json({ message: 'IIIT participants must use an IIIT email address (@iiit.ac.in)' });
            }
        }

        const user = await User.create({
            email,
            password,
            role: 'participant',
            firstName,
            lastName,
            participantType,
            college,
            contactNumber
        });

        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            participantType: user.participantType,
            onboardingComplete: user.onboardingComplete,
            token: generateToken(user._id, user.role)
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if organizer is active
        if (user.role === 'organizer' && (!user.isActive || user.isArchived)) {
            return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const userData = {
            _id: user._id,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        };

        // Add role-specific data
        if (user.role === 'participant') {
            userData.firstName = user.firstName;
            userData.lastName = user.lastName;
            userData.participantType = user.participantType;
            userData.onboardingComplete = user.onboardingComplete;
        } else if (user.role === 'organizer') {
            userData.organizerName = user.organizerName;
            userData.category = user.category;
        } else if (user.role === 'admin') {
            userData.firstName = 'Admin';
        }

        res.json(userData);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('followedOrganizers', 'organizerName category description');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update participant profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user.role === 'participant') {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.contactNumber = req.body.contactNumber || user.contactNumber;
            user.college = req.body.college || user.college;
            if (req.body.interests) user.interests = req.body.interests;
            if (req.body.followedOrganizers) user.followedOrganizers = req.body.followedOrganizers;
        } else if (user.role === 'organizer') {
            user.organizerName = req.body.organizerName || user.organizerName;
            user.category = req.body.category || user.category;
            user.description = req.body.description || user.description;
            user.contactEmail = req.body.contactEmail || user.contactEmail;
            user.contactPhone = req.body.contactPhone || user.contactPhone;
            user.discordWebhook = req.body.discordWebhook || user.discordWebhook;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            email: updatedUser.email,
            role: updatedUser.role,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            participantType: updatedUser.participantType,
            college: updatedUser.college,
            contactNumber: updatedUser.contactNumber,
            interests: updatedUser.interests,
            followedOrganizers: updatedUser.followedOrganizers,
            organizerName: updatedUser.organizerName,
            category: updatedUser.category,
            description: updatedUser.description,
            contactEmail: updatedUser.contactEmail,
            contactPhone: updatedUser.contactPhone,
            discordWebhook: updatedUser.discordWebhook,
            onboardingComplete: updatedUser.onboardingComplete
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Complete onboarding (save interests + followed organizers)
// @route   POST /api/auth/onboarding
const completeOnboarding = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'participant') {
            return res.status(403).json({ message: 'Only participants can complete onboarding' });
        }

        if (req.body.interests) user.interests = req.body.interests;
        if (req.body.followedOrganizers) user.followedOrganizers = req.body.followedOrganizers;
        user.onboardingComplete = true;

        await user.save();
        res.json({ message: 'Onboarding completed', onboardingComplete: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { register, login, getMe, updateProfile, completeOnboarding, changePassword };
