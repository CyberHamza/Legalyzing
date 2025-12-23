/**
 * Diagnostic script to check Pinecone stored vectors for a user
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Pinecone } = require('@pinecone-database/pinecone');

async function diagnose() {
    console.log('--- PINECONE RAG DIAGNOSTIC ---');
    
    // 1. Initialize Pinecone
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index(process.env.PINECONE_INDEX_NAME || 'legal-documents');
    
    // 2. Connect to MongoDB
    await connectDB();
    
    // 3. Get a recent user document
    const Document = require('../models/Document');
    const recentDoc = await Document.findOne({ processed: true, pineconeIndexed: true })
        .sort({ createdAt: -1 });
    
    if (!recentDoc) {
        console.log('❌ No indexed documents found');
        process.exit(1);
    }
    
    console.log('\n📄 Recent Document:');
    console.log(`  ID: ${recentDoc._id}`);
    console.log(`  Name: ${recentDoc.originalName}`);
    console.log(`  User (ObjectId): ${recentDoc.user._id || recentDoc.user}`);
    console.log(`  User.toString(): ${(recentDoc.user._id || recentDoc.user).toString()}`);
    console.log(`  Pinecone Indexed: ${recentDoc.pineconeIndexed}`);
    
    // 4. Query Pinecone to see what's actually stored
    console.log('\n🔍 Checking Pinecone for stored vectors...');
    
    // Use fetch to get vectors by ID prefix
    const docId = recentDoc._id.toString();
    const userId = (recentDoc.user._id || recentDoc.user).toString();
    
    // Query with a dummy vector to see if filter works (Pinecone index is 1024-dim)
    const dummyVector = new Array(1024).fill(0.1);
    
    console.log(`\n🔎 Querying with filter: userId=${userId}, documentId=${docId}`);
    
    const result = await index.namespace('user-uploads').query({
        vector: dummyVector,
        topK: 5,
        includeMetadata: true,
        filter: {
            userId: userId,
            documentId: docId
        }
    });
    
    console.log(`\n📊 Query Results: ${result.matches?.length || 0} matches`);
    
    if (result.matches?.length > 0) {
        console.log('\n✅ Vectors found! Sample metadata:');
        console.log(JSON.stringify(result.matches[0].metadata, null, 2));
    } else {
        console.log('\n❌ No vectors found with this filter. Trying without documentId...');
        
        // Try without documentId filter
        const result2 = await index.namespace('user-uploads').query({
            vector: dummyVector,
            topK: 5,
            includeMetadata: true,
            filter: { userId: userId }
        });
        
        console.log(`📊 Query with only userId: ${result2.matches?.length || 0} matches`);
        
        if (result2.matches?.length > 0) {
            console.log('\n✅ Vectors found! Sample metadata:');
            console.log(JSON.stringify(result2.matches[0].metadata, null, 2));
            console.log(`\nStored userId: "${result2.matches[0].metadata.userId}"`);
            console.log(`Query userId: "${userId}"`);
            console.log(`Match: ${result2.matches[0].metadata.userId === userId}`);
        } else {
            console.log('\n❌ No vectors found even with just userId filter. Checking all vectors...');
            
            // Query without any filter
            const result3 = await index.namespace('user-uploads').query({
                vector: dummyVector,
                topK: 5,
                includeMetadata: true
            });
            
            console.log(`📊 Query without filter: ${result3.matches?.length || 0} matches`);
            if (result3.matches?.length > 0) {
                console.log('\nSample stored metadata:');
                console.log(JSON.stringify(result3.matches[0].metadata, null, 2));
            }
        }
    }
    
    console.log('\n--- DIAGNOSTIC COMPLETE ---');
    process.exit(0);
}

diagnose().catch(err => {
    console.error('Diagnostic Error:', err);
    process.exit(1);
});
