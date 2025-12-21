const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('MONGO_URI Length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 'Undefined');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding...');

        const adminEmail = 'superadmin@legalyze.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Super Admin already exists. Updating role...');
            existingAdmin.role = 'superadmin';
            existingAdmin.isVerified = true;
            await existingAdmin.save();
            console.log('Super Admin Role Updated!');
        } else {
            const newAdmin = new User({
                firstName: 'Super',
                lastName: 'Admin',
                email: adminEmail,
                password: 'SuperAdmin123!', // You should change this immediately
                role: 'superadmin',
                isVerified: true
            });
            await newAdmin.save();
            console.log('Super Admin Created Successfully!');
        }

        process.exit();
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedAdmin();
