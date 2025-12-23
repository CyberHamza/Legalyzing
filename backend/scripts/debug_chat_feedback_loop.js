require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const pineconeService = require('../services/pineconeService');
const Document = require('../models/Document');
const LegalAgentService = require('../services/LegalAgentService');
const connectDB = require('../config/db');

// Mock Data
const MOCK_USER_ID = new mongoose.Types.ObjectId();
const MOCK_DOC_ID = new mongoose.Types.ObjectId();

async function testEndToEndFallback() {
    console.log('--- E2E TEST: UPLOAD -> CHAT FALLBACK ---');
    await connectDB();

    try {
        // 1. Simulate "Orphaned" Upload (No chat ID linked yet)
        console.log('📤 Simulating recent user upload...');
        const chunks = [{
            chunkIndex: 0,
            text: "The ECP Case decision states that all elections must be held on 8th Feb 2024 without delay.",
            embedding: new Array(1024).fill(0.1),
            metadata: {
                docType: 'Judgment',
                laws: ['Election Act 2017']
            }
        }];

        // Save metadata to Mongo (needed for Fallback lookup)
        await Document.create({
            _id: MOCK_DOC_ID,
            user: MOCK_USER_ID,
            filename: 'ECP_Case.pdf',
            originalName: 'ECP_Case.pdf',
            s3Key: 'mock_ecp_' + Date.now(),
            s3Url: 'http://mock.url',
            fileSize: 5000,
            mimeType: 'application/pdf',
            processed: true,
            pineconeIndexed: true,
            chatId: 'unsorted' // Frontend hasn't linked it yet
        });

        // Index in Pinecone (needed for RAG retrieval)
        await pineconeService.upsertVectors(
            MOCK_DOC_ID, 
            "ECP_Case.pdf", 
            MOCK_USER_ID, 
            chunks, 
            'user-uploads'
        );

        console.log('⏳ Waiting 5s for Pinecone consistency...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 2. Simulate Chat Request (NO documentIds provided)
        console.log('❓ User asks question (No Doc ID provided)...');
        const query = "What is the date of elections mentioned in the ECP case?";

        // NOTE: We are intentionally passing an empty/null documentIds array
        // But we need to simulate the RESOLUTION logic from chat.js first?
        // Actually, LegalAgentService doesn't have the fallback logic; chat.js does.
        // So we must replicate the chat.js resolution step here before calling Agent.
        
        let resolvedDocIds = [];
        console.log('🕵️ Executing Context Resolution Logic (mimicking chat.js)...');
        
        // --- CHAT.JS FALLBACK LOGIC ---
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentDocs = await Document.find({
             user: MOCK_USER_ID,
             createdAt: { $gte: fifteenMinutesAgo }
        }).sort({ createdAt: -1 }).limit(1).select('_id');

        if (recentDocs.length > 0) {
             resolvedDocIds = [recentDocs[0]._id];
             console.log(`✅ Resolution Success: Found Doc ${resolvedDocIds[0]}`);
        } else {
             console.log('❌ Resolution Failed: No doc found');
        }
        // ------------------------------

        if (resolvedDocIds.length === 0) throw new Error("Fallback failed to find doc");

        // 3. Call Agent with Resolved IDs
        console.log('🤖 Calling Legal Agent...');
        const result = await LegalAgentService.processQuery(query, {
            userId: MOCK_USER_ID.toString(),
            documentIds: resolvedDocIds.map(id => id.toString()),
            history: []
        });

        console.log('\n--- AGENT RESPONSE ---');
        console.log(result.content);
        
        if (result.content.includes('8th Feb') || result.content.includes('8th February')) {
            console.log('✅ SUCCESS: System retrieved answer via fallback context!');
        } else {
            console.error('❌ FAILURE: System guessed or hallucinated.');
        }

        // Cleanup
        await Document.deleteOne({ _id: MOCK_DOC_ID });
        await pineconeService.deleteVectors(MOCK_DOC_ID, 'user-uploads');

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testEndToEndFallback();
