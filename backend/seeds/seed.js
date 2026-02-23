const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        // Check if admin exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin already exists:', existingAdmin.email);
            process.exit(0);
        }

        const admin = await User.create({
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            firstName: 'System',
            lastName: 'Admin'
        });

        console.log(`Admin account created successfully!`);
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${adminPassword}`);

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedAdmin();
