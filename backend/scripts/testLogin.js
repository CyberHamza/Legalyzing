require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Find user
        const user = await User.findOne({ email: 'admin@legalyze.com' }).select('+password');
        
        if (!user) {
            console.log('❌ User not found!');
            process.exit(1);
        }

        console.log('✅ User found:', user.email);
        console.log('📝 Stored password hash:', user.password);
        
        // Test password
        const testPassword = 'Admin@123';
        console.log('🔑 Testing password:', testPassword);
        
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log('🔐 Password match:', isMatch);
        
        // Also test the method
        const isMatchMethod = await user.comparePassword(testPassword);
        console.log('🔐 Password match (method):', isMatchMethod);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testLogin();
