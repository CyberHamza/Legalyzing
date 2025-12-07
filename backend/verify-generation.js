const axios = require('axios');

const testGenerationModes = async () => {
    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'tester@gmail.com',
            password: 'Test1234'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful\n');

        // 2. Test Chat Mode (Flexible - Missing Fields Allowed)
        console.log('2. Testing CHAT Mode (Flexible)...');
        try {
            const chatResponse = await axios.post('http://localhost:5000/api/smart-generate/generate', {
                documentType: 'house-rent',
                fieldOverrides: {
                    landlordName: 'John Doe'
                    // Missing other required fields
                },
                allowMissingFields: true // Simulate Chat "Generate Now"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Chat Mode Success: Document generated despite missing fields');
            console.log('   Document ID:', chatResponse.data.data.document.id);
        } catch (error) {
            console.error('❌ Chat Mode Failed:', error.response?.data?.message || error.message);
        }
        console.log('');

        // 3. Test Form Mode (Strict - Missing Fields)
        console.log('3. Testing FORM Mode (Strict - Missing Fields)...');
        try {
            await axios.post('http://localhost:5000/api/smart-generate/generate', {
                documentType: 'house-rent',
                fieldOverrides: {
                    landlordName: 'John Doe'
                    // Missing other required fields
                },
                allowMissingFields: false // Simulate Form "Generate Document" (default)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.error('❌ Form Mode Failed: Should have rejected missing fields but succeeded');
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message === 'Missing required fields') {
                console.log('✅ Form Mode Success: Correctly rejected missing fields');
                console.log('   Error Message:', error.response.data.message);
                console.log('   Missing Fields:', error.response.data.missingFields);
            } else {
                console.error('❌ Form Mode Unexpected Error:', error.response?.data || error.message);
            }
        }
        console.log('');

        // 4. Test Form Mode (Strict - All Fields)
        console.log('4. Testing FORM Mode (Strict - All Fields)...');
        try {
            const formResponse = await axios.post('http://localhost:5000/api/smart-generate/generate', {
                documentType: 'house-rent',
                fieldOverrides: {
                    landlordName: 'John Doe',
                    companyName: 'Tech Corp',
                    propertyAddress: '123 Main St',
                    monthlyRent: 50000,
                    // Add other required fields to satisfy completeness check
                    directorName: 'Jane Smith',
                    designation: 'CEO',
                    companyAddress: '456 Tech Park',
                    agreementDate: '2024-01-01',
                    leaseStartDate: '2024-02-01',
                    leaseEndDate: '2025-01-31',
                    signingPlace: 'City',
                    signingDate: '2024-01-01',
                    witness1Name: 'Witness 1',
                    witness1Address: 'Address 1',
                    witness2Name: 'Witness 2',
                    witness2Address: 'Address 2'
                },
                allowMissingFields: false
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Form Mode Success: Document generated with all fields');
            console.log('   Document ID:', formResponse.data.data.document.id);
        } catch (error) {
            console.error('❌ Form Mode Failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Setup Error:', error.message);
    }
};

testGenerationModes();
