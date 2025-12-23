require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Document = require('../models/Document');
const connectDB = require('../config/db');

async function debugFallback() {
    console.log('--- DEBUGGING FALLBACK CONTEXT ---');
    await connectDB();

    try {
        // 1. Create a dummy "recent" document
        const userId = new mongoose.Types.ObjectId();
        const docId = new mongoose.Types.ObjectId();
        
        console.log(`👤 Mock User ID: ${userId}`);
        
        const doc = await Document.create({
            _id: docId,
            user: userId,
            filename: 'Recent_Upload.pdf',
            originalName: 'Recent_Upload.pdf',
            s3Key: 'mock_key_' + Date.now(),
            s3Url: 'http://mock.url',
            fileSize: 1024,
            mimeType: 'application/pdf',
            processed: true,
            chatId: 'unsorted' // Frontend default
        });
        console.log(`📄 Created Mock Document: ${docId}`);

        // 2. Simulate the fallback logic EXACTLY as in chat.js
        console.log('🕵️ simulating chat.js logic...');
        
        let documentIds = [];
        let conversationId = null; // New chat scenario
        
        // --- LOGIC START ---
        if (!documentIds || documentIds.length === 0) {
             console.log('⚠️ New Conversation: Looking for recent user uploads...');
             const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
             const recentDocs = await Document.find({
                 user: userId,
                 createdAt: { $gte: fifteenMinutesAgo }
             }).sort({ createdAt: -1 }).limit(1).select('_id');

             if (recentDocs.length > 0) {
                 documentIds = [recentDocs[0]._id];
                 console.log(`✅ Fallback (New Chat): Auto-attached most recent upload: ${recentDocs[0]._id}`);
             }
        }
        // --- LOGIC END ---

        if (documentIds.length > 0 && documentIds[0].toString() === docId.toString()) {
            console.log('✅ PASS: Fallback correctly identified the document.');
        } else {
            console.error('❌ FAIL: Fallback did NOT find the document.');
        }

        // Cleanup
        await Document.deleteOne({ _id: docId });

    } catch (error) {
        console.error('Debug Failed:', error);
    }
}

debugFallback();
