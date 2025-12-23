require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const LegalAgentService = require('../services/LegalAgentService');
const connectDB = require('../config/db');

async function debugLawSearch() {
    console.log('--- DEBUGGING LAW SEARCH CHAT REQUEST ---');
    await connectDB();

    try {
        // REALISTIC PAYLOAD EXACTLY AS SENT BY WIZARD
        const facts = "My client was accused of murder under section 302 but it was actually self defense during a robbery attempt.";
        const caseType = "criminal";
        const query = `List detailed Pakistani laws for this ${caseType} case.
                    
FACTS: ${facts}

Return JSON array: [{"section": "...", "law": "...", "description": "...", "relevance": "..."}]`;

        // The previous test document ID that likely gets auto-attached
        const documentIds = ["694a3736d4d7c28fd2d8655b"]; 
        const mockUserId = "66f2b45e76307908b8716298"; // Approximate user ID

        console.log(`❓ Simulating Wizard Query with Fallback Doc Context...`);
        console.log(`Query Length: ${query.length}`);

        const options = {
            userId: mockUserId,
            documentIds: documentIds,
            conversationId: null, 
            history: []
        };

        console.log('--- Calling LegalAgentService ---');
        const result = await LegalAgentService.processQuery(query, options);

        console.log('\n--- AGENT RESPONSE ---');
        console.log(result.content);
        console.log('\n--- METADATA ---');
        console.log(JSON.stringify(result.metadata, null, 2));

    } catch (error) {
        console.error('❌ CRASH REPRODUCED:', error);
    }
}

debugLawSearch();
