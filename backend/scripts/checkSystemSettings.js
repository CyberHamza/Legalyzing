require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const SystemSettings = require('../models/SystemSettings');

const checkSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const settings = await SystemSettings.getSettings();
        console.log('Current System Settings:');
        console.log(JSON.stringify(settings, null, 2));

        if (settings.maintenanceMode) {
            console.log('⚠️ MAINTENANCE MODE IS ENABLED - This explains why users are getting logged out.');
        } else {
            console.log('✅ Maintenance Mode is DISABLED.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkSettings();
