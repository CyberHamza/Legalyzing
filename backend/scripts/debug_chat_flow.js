require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const LegalAgentService = require('../services/LegalAgentService');
const pineconeService = require('../services/pineconeService');

// Mock User ID (must match what we used in verify_rag_isolation.js or a fresh one)
const MOCK_USER_ID = new mongoose.Types.ObjectId();
const MOCK_DOC_ID = new mongoose.Types.ObjectId();

const connectDB = require('../config/db');

async function debugChatFlow() {
    console.log('--- DEBUGGING CHAT RAG FLOW ---');
    await connectDB(); // Connect to real DB for SystemPrompt check

    try {
        // ... (upsert logic unchanged) ...
        const chunks = [{
            chunkIndex: 0,
            text: "This document describes the specific case of Ali Hamza vs The State.",
            embedding: new Array(1024).fill(0.1)
        }];

        await pineconeService.upsertVectors(MOCK_DOC_ID, "Test.pdf", MOCK_USER_ID, chunks, 'user-uploads');

        // 2. Simulate User Query EXACT MATCH
        const query = "Please brief me about this document what is being told in this document";
        
        console.log(`❓ Simulating Query: "${query}"`);
        console.log(`📄 Context: Document ID ${MOCK_DOC_ID}`);

        const result = await LegalAgentService.processQuery(query, {
            userId: MOCK_USER_ID.toString(),
            documentIds: [MOCK_DOC_ID.toString()], // Explicitly pass doc ID
            history: []
        });

        console.log('\n--- AGENT RESPONSE ---');
        console.log(result.content);
        console.log('\n--- METADATA ---');
        console.log(JSON.stringify(result.metadata, null, 2));

        // Check if correct tool was used
        if (result.metadata.toolsUsed.includes('user-documents')) {
            console.log('✅ ROUTING PASS: Selected [user-documents] tool');
        } else {
            console.error('❌ ROUTING FAIL: Did NOT select [user-documents] tool');
        }

        // Check if content mentions the fact
        if (result.content.includes('12-12-2024')) {
            console.log('✅ RETRIEVAL PASS: Found specific fact from document');
        } else {
            console.error('❌ RETRIEVAL FAIL: Did NOT find specific status/fact');
        }

    } catch (error) {
        console.error('Debug Failed:', error);
    }
}

debugChatFlow();
