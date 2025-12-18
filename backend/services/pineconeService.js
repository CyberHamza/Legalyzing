const { Pinecone } = require('@pinecone-database/pinecone');

// Lazy initialization of Pinecone client
let pinecone = null;
let isInitialized = false;

/**
 * Initialize Pinecone client (lazy loading)
 */
function initializePinecone() {
    if (isInitialized && pinecone) {
        return pinecone;
    }
    
    const apiKey = process.env.PINECONE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('PINECONE_API_KEY is not configured. Please set it in your .env file.');
    }
    
    pinecone = new Pinecone({
        apiKey: apiKey
    });
    isInitialized = true;
    return pinecone;
}

/**
 * Get the Pinecone index instance
 */
function getIndex() {
    const client = initializePinecone();
    const indexName = process.env.PINECONE_INDEX_NAME?.trim() || 'legal-documents';
    return client.index(indexName);
}

/**
 * Upsert document chunks as vectors to Pinecone
 * @param {string} documentId - MongoDB document ID
 * @param {string} documentName - Original document name
 * @param {string} userId - User ID for filtering
 * @param {Array} chunks - Array of chunks with text and embedding
 */
async function upsertVectors(documentId, documentName, userId, chunks) {
    try {
        const index = getIndex();
        
        // Prepare vectors for upsert
        const vectors = chunks.map((chunk, index) => ({
            id: `${documentId}_chunk_${chunk.chunkIndex}`,
            values: chunk.embedding,
            metadata: {
                userId: userId.toString(),
                documentId: documentId.toString(),
                documentName: documentName,
                chunkIndex: chunk.chunkIndex,
                text: chunk.text.substring(0, 40000), // Pinecone metadata limit
                ...(chunk.metadata || {})
            }
        }));

        // Upsert in batches of 100 (Pinecone recommendation)
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.upsert(batch);
        }

        console.log(`✅ Upserted ${vectors.length} vectors for document ${documentId}`);
        return { success: true, vectorCount: vectors.length };
        
    } catch (error) {
        console.error('❌ Pinecone upsert error:', error);
        throw new Error(`Failed to upsert vectors to Pinecone: ${error.message}`);
    }
}

/**
 * Query Pinecone for similar vectors
 * @param {Array} queryEmbedding - Query vector embedding
 * @param {number} topK - Number of results to return
 * @param {string} userId - User ID for filtering
 * @param {Array} documentIds - Optional array of document IDs to filter by
 */
async function queryVectors(queryEmbedding, topK = 5, userId, documentIds = null, chatId = null) {
    try {
        const index = getIndex();
        
        // Build filter
        const filter = { userId: userId.toString() };
        
        // Add Chat ID filter (scoped RAG)
        // CRITICAL FIX: If documentIds are provided, we rely on them explicitly and skip chatId filter
        // to avoid mismatch issues (e.g. doc uploaded as 'unsorted' but queried in new chat).
        // We only use chatId filter if NO documentIds are provided (pure context search).
        
        if (documentIds && documentIds.length > 0) {
            filter.documentId = { $in: documentIds.map(id => id.toString()) };
            console.log('🔍 Querying Pinecone by Document IDs:', documentIds.length);
        } else if (chatId) {
            filter.chatId = chatId.toString();
            console.log('🔍 Querying Pinecone by Chat ID:', chatId);
        }

        // Query Pinecone
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true,
            filter: filter
        });

        // Format results to match existing structure
        const relevantChunks = queryResponse.matches.map(match => ({
            documentId: match.metadata.documentId,
            documentName: match.metadata.documentName,
            text: match.metadata.text,
            chunkIndex: match.metadata.chunkIndex,
            similarity: match.score
        }));

        console.log(`🔍 Found ${relevantChunks.length} relevant chunks from Pinecone`);
        return relevantChunks;
        
    } catch (error) {
        console.error('❌ Pinecone query error:', error);
        throw new Error(`Failed to query vectors from Pinecone: ${error.message}`);
    }
}

/**
 * Delete all vectors for a document
 * @param {string} documentId - MongoDB document ID
 */
async function deleteVectors(documentId) {
    try {
        const index = getIndex();
        
        // Delete by filter (all chunks for this document)
        await index.deleteMany({
            documentId: documentId.toString()
        });

        console.log(`🗑️  Deleted all vectors for document ${documentId}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Pinecone delete error:', error);
        throw new Error(`Failed to delete vectors from Pinecone: ${error.message}`);
    }
}

/**
 * Delete all vectors for a user (utility function)
 * @param {string} userId - User ID
 */
async function deleteUserVectors(userId) {
    try {
        const index = getIndex();
        
        // Delete by filter (all vectors for this user)
        await index.deleteMany({
            userId: userId.toString()
        });

        console.log(`🗑️  Deleted all vectors for user ${userId}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Pinecone delete user vectors error:', error);
        throw new Error(`Failed to delete user vectors from Pinecone: ${error.message}`);
    }
}

/**
 * Get vector count for a document
 * @param {string} documentId - MongoDB document ID
 */
async function getDocumentVectorCount(documentId) {
    try {
        const index = getIndex();
        
        // Query with zero vector to get count (we only care about metadata)
        const stats = await index.describeIndexStats();
        
        // Note: Pinecone doesn't provide exact counts per metadata filter easily
        // This is a limitation - we'll trust our MongoDB chunkCount field
        return { success: true, note: 'Use MongoDB chunkCount field for accurate count' };
        
    } catch (error) {
        console.error('❌ Pinecone stats error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Query Constitution namespace for constitutional articles
 * @param {Array} queryEmbedding - Query vector embedding
 * @param {number} topK - Number of results to return
 */
async function queryConstitution(queryEmbedding, topK = 10) {
    try {
        const index = getIndex();
        const namespace = 'constitution-pakistan';
        
        // Query Constitution namespace (no user filtering needed)
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        });

        // Format results with constitutional metadata
        const articles = queryResponse.matches.map(match => ({
            articleNumber: match.metadata.articleNumber,
            heading: match.metadata.heading,
            part: match.metadata.part,
            partName: match.metadata.partName,
            chapter: match.metadata.chapter,
            text: match.metadata.text,
            similarity: match.score,
            id: match.id
        }));

        console.log(`🏛️  Found ${articles.length} relevant constitutional articles`);
        return articles;
        
    } catch (error) {
        console.error('❌ Pinecone Constitution query error:', error);
        throw new Error(`Failed to query Constitution from Pinecone: ${error.message}`);
    }
}

/**
 * Upsert Constitution articles to Pinecone namespace
 * @param {Array} vectors - Array of vectors with metadata
 */
async function upsertConstitution(vectors) {
    try {
        const index = getIndex();
        const namespace = 'constitution-pakistan';
        
        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.namespace(namespace).upsert(batch);
        }

        console.log(`✅ Upserted ${vectors.length} Constitution articles to Pinecone`);
        return { success: true, vectorCount: vectors.length };
        
    } catch (error) {
        console.error('❌ Pinecone Constitution upsert error:', error);
        throw new Error(`Failed to upsert Constitution to Pinecone: ${error.message}`);
    }
}

/**
 * Query constitution index with full provenance metadata
 * Used by compliance matching engine
 */
async function queryConstitutionWithProvenance(queryText, topK = 5) {
    try {
        const { generateEmbedding } = require('../utils/documentProcessor');
        const queryEmbedding = await generateEmbedding(queryText);
        
        const index = getIndex();
        const namespace = 'constitution-pakistan';
        
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        });
        
        return queryResponse.matches || [];
    } catch (error) {
        console.error('Error querying constitution with provenance:', error);
        return [];
    }
}

/**
 * Upsert raw vectors directly to Pinecone (used for judgment indexing)
 * @param {Array} vectors - Array of { id, values, metadata }
 * @param {string} namespace - Optional namespace
 */
async function upsertRawVectors(vectors, namespace = null) {
    try {
        const index = getIndex();
        
        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            if (namespace) {
                await index.namespace(namespace).upsert(batch);
            } else {
                await index.upsert(batch);
            }
        }

        console.log(`✅ Upserted ${vectors.length} raw vectors to Pinecone`);
        return { success: true, vectorCount: vectors.length };
        
    } catch (error) {
        console.error('❌ Pinecone raw upsert error:', error);
        throw new Error(`Failed to upsert raw vectors: ${error.message}`);
    }
}

/**
 * Query vectors with custom filter (used for judgment search)
 * @param {Array} queryEmbedding - Query vector
 * @param {number} topK - Number of results
 * @param {Object} filter - Custom filter object
 * @param {string} namespace - Optional namespace
 */
async function queryVectorsWithFilter(queryEmbedding, topK = 10, filter = {}, namespace = null) {
    try {
        const index = getIndex();
        
        const queryOptions = {
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true,
            filter: filter
        };

        let queryResponse;
        if (namespace) {
            queryResponse = await index.namespace(namespace).query(queryOptions);
        } else {
            queryResponse = await index.query(queryOptions);
        }

        return queryResponse.matches.map(match => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata
        }));
        
    } catch (error) {
        console.error('❌ Pinecone query with filter error:', error);
        throw new Error(`Failed to query with filter: ${error.message}`);
    }
}

module.exports = {
    upsertVectors,
    queryVectors,
    deleteVectors,
    deleteUserVectors,
    getDocumentVectorCount,
    queryConstitution,
    upsertConstitution,
    queryConstitutionWithProvenance,
    upsertRawVectors,
    queryVectorsWithFilter
};
