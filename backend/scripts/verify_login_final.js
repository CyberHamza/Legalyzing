const axios = require('axios');

const TOKEN = '5cc4001c52b909248a7cf147d09ecdcb533db9d4';
const EMAIL = 'test_1765622597219@gmail.com';
const PASSWORD = 'Password123!';
const API_URL = 'http://127.0.0.1:5000/api/auth';

async function verifyAndLogin() {
    console.log('1. Verifying Email...');
    try {
        const verifyRes = await axios.get(`${API_URL}/verify-email/${TOKEN}`);
        console.log('   Verification Success:', verifyRes.data.success);
    } catch (err) {
        console.error('   Verification Failed:', err.response?.data || err.message);
        return;
    }

    console.log('\n2. Attempting Login (Should Succeed)...');
    try {
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        console.log('   ✅ Login Success! Token received:', !!loginRes.data.data.token);
    } catch (err) {
        console.error('   ❌ Login Failed:', err.response?.data || err.message);
    }
}

verifyAndLogin();
