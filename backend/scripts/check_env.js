const path = require('path');
const dotenv = require('dotenv');

// Try verify absolute path
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ Failed to load .env:', result.error);
} else {
    console.log('✅ .env loaded successfully');
}

console.log('--- ENV CHECK ---');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
    console.log('MONGO_URI Length:', process.env.MONGO_URI.length);
}

console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
if (process.env.JWT_SECRET) {
    console.log('JWT_SECRET Length:', process.env.JWT_SECRET.length);
    console.log('JWT_SECRET First 2 chars:', process.env.JWT_SECRET.substring(0, 2));
} else {
    console.error('❌ JWT_SECRET IS MISSING!');
}

console.log('NODE_ENV:', process.env.NODE_ENV);
