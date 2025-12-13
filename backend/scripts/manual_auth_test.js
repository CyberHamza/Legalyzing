const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api/auth';
const TEST_USER = {
    email: `test_${Date.now()}@gmail.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: '1990-01-01'
};

async function testAuth() {
    console.log('1. Attempting Signup...');
    try {
        const signupRes = await axios.post(`${API_URL}/signup`, TEST_USER);
        console.log('   Signup Success:', signupRes.data.success);
    } catch (err) {
        console.error('   Signup Failed:', err.response?.data || err.message);
        return; // Stop if signup fails
    }

    console.log('\n2. Attempting Login (Should Fail - Unverified)...');
    try {
        await axios.post(`${API_URL}/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        console.error('   ❌ Login succeeded but should have FAILED!');
    } catch (err) {
        if (err.response?.status === 401 && err.response?.data?.message.includes('verify')) {
            console.log('   ✅ Login failed as expected:', err.response.data.message);
        } else {
            console.error('   ❌ Login failed with unexpected error:', err.response?.data || err.message);
        }
    }
}

testAuth();
