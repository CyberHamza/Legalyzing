const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login to http://localhost:5000/api/auth/login...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com', // Replace with a valid test user if known, or generic to see 401 vs Connection Refused
            password: 'password123'
        });
        console.log('Login Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Server responded with:', error.response.status, error.response.data);
            if (error.response.status === 401 || error.response.status === 400) {
                 console.log('SUCCESS: Server is reachable and handling auth requests (even if creds are wrong)');
                 return;
            }
        } else if (error.request) {
            console.log('No response received (Connection Refused/Timeout):', error.message);
        } else {
            console.log('Error setup:', error.message);
        }
        process.exit(1);
    }
}

testLogin();
