require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// Mock Request/Response for middleware testing
const mockReq = (token) => ({
    headers: { authorization: `Bearer ${token}` },
    user: null
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

const debugFlow = async () => {
    try {
        console.log('--- STARTING DEBUG FLOW ---');
        
        // 1. Connect DB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ DB Connected');

        // 2. Find a Test User
        const testEmail = 'superadmin@legalyze.com'; // Or any user
        const user = await User.findOne({ email: testEmail });
        
        if (!user) {
            console.error('❌ Test user not found:', testEmail);
            process.exit(1);
        }
        console.log('👤 User Found:', user.email);
        console.log('   Role:', user.role);
        console.log('   Verified:', user.isVerified);
        console.log('   Active:', user.isActive);

        // 3. Generate Token (Simulate Login)
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET is missing in .env');
            process.exit(1);
        }
        console.log('🔑 JWT_SECRET Length:', process.env.JWT_SECRET.length);
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        console.log('🎟️  Token Generated');

        // 4. Verify Token (Simulate Middleware)
        console.log('--- TESTING MIDDLEWARE LOGIC ---');
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token Verified via jwt.verify');
            console.log('   Decoded ID:', decoded.id);
            
            // Fetch User via ID in Token
            const userFromToken = await User.findById(decoded.id);
            if (!userFromToken) {
                console.error('❌ User not found from token ID');
            } else {
                console.log('✅ User retrieved from token ID');
                
                // Re-check middleware specific blocks
                if (!userFromToken.isActive) {
                    console.error('❌ BLOCKED: User !isActive');
                } else {
                    console.log('✅ PASS: User is active');
                }
            }

        } catch (err) {
            console.error('❌ Token Verification Failed:', err.message);
        }

        console.log('--- END DEBUG FLOW ---');
        await mongoose.disconnect();

    } catch (error) {
        console.error('Fatal Error:', error);
    }
};

debugFlow();
