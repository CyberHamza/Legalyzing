const Judgment = require('../models/Judgment');
const pineconeService = require('./pineconeService');
const { generateEmbedding } = require('../utils/documentProcessor');

/**
 * Legalyze Hybrid Search Service
 * Combines MongoDB Text Search (Keyword) with Pinecone Vector Search (Semantic)
 * Fixes Limitation #2: "Shallow Retrieval"
 */

/**
 * Perform Hybrid Search for Judgments
 * @param {string} query - The search query
 * @param {Object} filters - Optional filters (court, year, etc.)
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Merged and ranked judgments
 */
async function hybridSearch(query, filters = {}, limit = 20) {
    try {
        console.log(`🔍 Starting Hybrid Search for: "${query}"`);

        // 1. Generate Embedding for Semantic Search
        const queryEmbedding = await generateEmbedding(query);

        // 2. Run Parallel Searches
        const [keywordResults, vectorResults] = await Promise.all([
            // MongoDB Text Search (Exact Match / Citations)
            Judgment.find(
                { $text: { $search: query } },
                { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .lean(),

            // Pinecone Vector Search (Conceptual Match)
            pineconeService.queryVectorsWithFilter(
                queryEmbedding, 
                limit, 
                filters, // e.g., { court: "Supreme Court" }
                'judgments' // Namespace
            )
        ]);

        console.log(`📊 Raw Results - Keyword: ${keywordResults.length}, Vector: ${vectorResults.length}`);

        // 3. Merge & Rank Results
        const mergedResults = mergeResults(keywordResults, vectorResults);

        // 4. Fetch full details for vector-only matches
        const finalResults = await hydrateResults(mergedResults);

        return finalResults.slice(0, limit);

    } catch (error) {
        console.error('❌ Hybrid Search Error:', error);
        throw error;
    }
}

/**
 * Merge Keyword and Vector results using Reciprocal Rank Fusion (simplified)
 */
function mergeResults(keywordResults, vectorResults) {
    const resultMap = new Map();

    // Process Keyword Results (High value for citations)
    keywordResults.forEach((doc, index) => {
        // Normalize score: 1.0 down to 0.5 based on rank
        const rankScore = 1.0 - (index / (keywordResults.length + 1)) * 0.5;
        resultMap.set(doc._id.toString(), {
            id: doc._id.toString(),
            doc: doc,
            score: rankScore,
            source: 'keyword'
        });
    });

    // Process Vector Results
    vectorResults.forEach((match, index) => {
        // Vector match.id is the MongoDB _id
        const existing = resultMap.get(match.id);
        
        // Normalize score from Pinecone (usually 0.7-0.9 for good matches)
        const vectorScore = match.score || 0;

        if (existing) {
            // Boost score if found in BOTH (Hybrid Hit!)
            existing.score += vectorScore;
            existing.source = 'hybrid';
            existing.vectorScore = vectorScore;
        } else {
            resultMap.set(match.id, {
                id: match.id,
                // Result needs detailed hydration later
                score: vectorScore, 
                source: 'vector'
            });
        }
    });

    // Convert to array and sort by score
    return Array.from(resultMap.values())
        .sort((a, b) => b.score - a.score);
}

/**
 * Hydrate results that only came from Vector Store (fetch full doc from Mongo)
 */
async function hydrateResults(mergedItems) {
    const vectorOnlyIds = mergedItems
        .filter(item => !item.doc) // No doc populated yet
        .map(item => item.id);

    let hydratedDocs = [];
    if (vectorOnlyIds.length > 0) {
        hydratedDocs = await Judgment.find({ _id: { $in: vectorOnlyIds } }).lean();
    }

    // Map back to mergedItems
    return mergedItems.map(item => {
        let fullDoc = item.doc;
        if (!fullDoc) {
            fullDoc = hydratedDocs.find(d => d._id.toString() === item.id);
        }
        
        if (!fullDoc) return null; // Logic error or deleted doc

        return {
            ...fullDoc,
            searchScore: item.score.toFixed(3),
            matchType: item.source // 'keyword', 'vector', or 'hybrid'
        };
    }).filter(item => item !== null);
}

module.exports = {
    hybridSearch
};
