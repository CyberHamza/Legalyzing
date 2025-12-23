require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

async function testHttpAuth() {
    try {
        console.log('--- HTTP AUTH TEST STARTING ---');
        
        // 1. Get User and Token
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'superadmin@legalyze.com' }); // Or valid email
        if (!user) {
            console.error('User not found!');
            process.exit(1);
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log('🎟️  Token Generated');
        console.log('   Token:', token.substring(0, 20) + '...');
        
        await mongoose.disconnect(); // Disconnect to allow script to exit clean, server handles request separately

        // 2. Make Request to RUNNING Server
        const url = 'http://localhost:5000/api/auth/me';
        console.log(`🌐 POSTing to ${url}`);
        
        try {
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ SUCCESS! Status:', res.status);
            console.log('   User ID:', res.data.data.user.id);
            console.log('   Email:', res.data.data.user.email);
        } catch (httpErr) {
            console.error('❌ HTTP REQUEST FAILED');
            if (httpErr.response) {
                console.error('   Status:', httpErr.response.status);
                console.error('   Data:', httpErr.response.data);
            } else {
                console.error('   Error:', httpErr.message);
            }
        }

    } catch (err) {
        console.error('Fatal:', err);
    }
}

testHttpAuth();
