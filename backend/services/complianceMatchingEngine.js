const { queryConstitutionWithProvenance } = require('./pineconeService');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Compliance Matching Engine
 * Core logic for sentence-level constitutional compliance checking
 * Provides YES/NO/PARTIAL decisions with confidence scores and provenance
 */

/**
 * Match a sentence from uploaded document to constitutional provisions
 * @param {Object} sentence - Sentence object with text and metadata
 * @param {number} topK - Number of top matches to retrieve
 * @returns {Array} - Array of matches with constitutional provisions
 */
async function matchSentenceToConstitution(sentence, topK = 5) {
    try {
        // Query Pinecone for semantically similar constitutional provisions
        const results = await queryConstitutionWithProvenance(sentence.text, topK);
        
        return results.map(match => ({
            constitutionText: match.metadata.text,
            article: match.metadata.articleNumber,
            articleHeading: match.metadata.articleHeading,
            part: match.metadata.part,
            partName: match.metadata.partName,
            startChar: match.metadata.startChar,
            endChar: match.metadata.endChar,
            lineStart: match.metadata.lineStart,
            lineEnd: match.metadata.lineEnd,
            similarityScore: match.score,
            pineconeId: match.id
        }));
    } catch (error) {
        console.error('Error matching sentence to constitution:', error);
        return [];
    }
}

/**
 * Determine compliance decision: YES, NO, or PARTIAL
 * Uses GPT-4 for nuanced legal analysis
 */
async function determineCompliance(uploadedText, constitutionMatch, context = {}) {
    try {
        const prompt = `You are Pakistan's leading constitutional law expert. Analyze whether the uploaded document text complies with the Constitution.

UPLOADED DOCUMENT TEXT:
"${uploadedText}"

RELEVANT CONSTITUTIONAL PROVISION:
Article ${constitutionMatch.article}: ${constitutionMatch.articleHeading}
"${constitutionMatch.constitutionText}"

INSTRUCTIONS:
1. Determine if the uploaded text is:
   - YES: Fully compliant (aligns with or upholds the constitutional provision)
   - NO: Non-compliant (contradicts or violates the constitutional provision)
   - PARTIAL: Partially compliant (some alignment but with gaps, ambiguities, or conditions)

2. Provide a 1-2 sentence rationale explaining your decision.

3. Assign a confidence score (0-100) based on:
   - Clarity of the constitutional provision
   - Clarity of the uploaded text
   - Strength of semantic alignment or contradiction

Return ONLY valid JSON:
{
  "decision": "YES|NO|PARTIAL",
  "confidence": 0-100,
  "rationale": "brief explanation"
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a constitutional law expert providing precise, factual compliance analysis. Return only valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 500,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        // Validate result
        if (!['YES', 'NO', 'PARTIAL'].includes(result.decision)) {
            throw new Error('Invalid decision value');
        }
        
        return {
            decision: result.decision,
            confidence: Math.min(100, Math.max(0, result.confidence || 70)),
            rationale: result.rationale || 'Analysis completed.'
        };
        
    } catch (error) {
        console.error('Error determining compliance:', error);
        
        // Fallback to similarity-based decision
        return fallbackComplianceDecision(constitutionMatch.similarityScore);
    }
}

/**
 * Fallback compliance decision based on similarity score
 */
function fallbackComplianceDecision(similarityScore) {
    if (similarityScore >= 0.85) {
        return {
            decision: 'YES',
            confidence: Math.round(similarityScore * 100),
            rationale: 'High semantic similarity indicates compliance.'
        };
    } else if (similarityScore >= 0.70) {
        return {
            decision: 'PARTIAL',
            confidence: Math.round(similarityScore * 100),
            rationale: 'Moderate similarity suggests partial compliance or ambiguity.'
        };
    } else {
        return {
            decision: 'NO',
            confidence: Math.round(similarityScore * 100),
            rationale: 'Low similarity may indicate non-compliance or irrelevance.'
        };
    }
}

/**
 * Calculate refined confidence score
 * Combines similarity score with text comparison factors
 */
function calculateConfidenceScore(similarityScore, additionalFactors = {}) {
    let baseScore = similarityScore * 100;
    
    // Adjust based on text length similarity
    if (additionalFactors.textLengthRatio) {
        const lengthRatio = additionalFactors.textLengthRatio;
        if (lengthRatio < 0.3 || lengthRatio > 3.0) {
            baseScore *= 0.9; // Reduce confidence if lengths very different
        }
    }
    
    // Adjust based on keyword overlap
    if (additionalFactors.keywordOverlap) {
        baseScore *= (1 + additionalFactors.keywordOverlap * 0.1);
    }
    
    return Math.min(100, Math.max(0, Math.round(baseScore)));
}

/**
 * Generate detailed rationale for a compliance decision
 */
async function generateRationale(uploadedText, constitutionMatch, decision, confidence) {
    try {
        const prompt = `Explain why this document text is ${decision.toLowerCase()} with Article ${constitutionMatch.article} (${constitutionMatch.articleHeading}).

Document text: "${uploadedText}"

Constitution: "${constitutionMatch.constitutionText}"

Provide a concise 2-3 sentence explanation that:
1. Identifies the key legal principle in the constitution
2. Shows how the document text relates to it
3. Justifies the ${decision} decision

Be specific and factual.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a constitutional lawyer providing clear, factual explanations.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 300
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating rationale:', error);
        return `The document text shows ${decision === 'YES' ? 'alignment' : decision === 'NO' ? 'contradiction' : 'partial alignment'} with Article ${constitutionMatch.article}.`;
    }
}

/**
 * Full compliance mapping for a single sentence
 * Returns complete mapping object with provenance
 */
async function createComplianceMapping(sentence, uploadedDocMeta = {}) {
    try {
        // Step 1: Find matching constitutional provisions
        const constitutionMatches = await matchSentenceToConstitution(sentence, 3);
        
        if (constitutionMatches.length === 0) {
            return null; // No relevant constitutional provision found
        }
        
        // Use top match
        const bestMatch = constitutionMatches[0];
        
        // Step 2: Determine compliance
        const complianceResult = await determineCompliance(
            sentence.text,
            bestMatch
        );
        
        // Step 3: Generate detailed rationale
        const rationale = await generateRationale(
            sentence.text,
            bestMatch,
            complianceResult.decision,
            complianceResult.confidence
        );
        
        // Step 4: Create full mapping object
        return {
            mapping_id: sentence.sentenceId,
            uploaded_text_snippet: sentence.text,
            snippet_location: {
                startChar: sentence.startChar,
                endChar: sentence.endChar,
                page: sentence.page,
                paragraph: sentence.paragraph,
                line: sentence.line
            },
            constitution_match: {
                text: bestMatch.constitutionText,
                article: `Article ${bestMatch.article}`,
                articleHeading: bestMatch.articleHeading,
                part: bestMatch.part ? `Part ${bestMatch.part}` : null,
                partName: bestMatch.partName,
                file: 'Constitution of Pakistan.txt',
                location: {
                    startChar: bestMatch.startChar,
                    endChar: bestMatch.endChar,
                    lineStart: bestMatch.lineStart,
                    lineEnd: bestMatch.lineEnd
                }
            },
            decision: complianceResult.decision,
            confidence: complianceResult.confidence,
            similarity_score: bestMatch.similarityScore,
            rationale: rationale,
            provenance: {
                pinecone_chunk_id: bestMatch.pineconeId,
                retrieval_score: bestMatch.similarityScore,
                query_used: sentence.text.substring(0, 100) + '...',
                timestamp: new Date().toISOString()
            },
            alternative_matches: constitutionMatches.slice(1).map(m => ({
                article: `Article ${m.article}`,
                similarity: m.similarityScore
            }))
        };
    } catch (error) {
        console.error('Error creating compliance mapping:', error);
        return null;
    }
}

/**
 * Process all sentences and create complete compliance mappings
 */
async function processDocumentCompliance(sentences, uploadedDocMeta = {}, options = {}) {
    const mappings = [];
    const batchSize = options.batchSize || 5;
    const maxSentences = options.maxSentences || 100;
    
    console.log(`📊 Processing ${Math.min(sentences.length, maxSentences)} sentences for compliance...`);
    
    const sentencesToProcess = sentences.slice(0, maxSentences);
    
    for (let i = 0; i < sentencesToProcess.length; i += batchSize) {
        const batch = sentencesToProcess.slice(i, i + batchSize);
        
        console.log(`   Processing sentences ${i + 1}-${Math.min(i + batchSize, sentencesToProcess.length)}...`);
        
        // Process batch in parallel
        const batchResults = await Promise.all(
            batch.map(sentence => createComplianceMapping(sentence, uploadedDocMeta))
        );
        
        // Add non-null results
        mappings.push(...batchResults.filter(m => m !== null));
        
        // Rate limiting delay
        if (i + batchSize < sentencesToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`✅ Created ${mappings.length} compliance mappings`);
    
    return mappings;
}

module.exports = {
    matchSentenceToConstitution,
    determineCompliance,
    calculateConfidenceScore,
    generateRationale,
    createComplianceMapping,
    processDocumentCompliance
};
