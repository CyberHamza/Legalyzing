const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Intent Detection Service
 * Detects when user wants to generate a document and identifies the document type
 */

const DOCUMENT_TYPES = {
    'house-rent': ['house rent', 'rental agreement', 'rent agreement', 'lease agreement', 'tenancy agreement'],
    'employment': ['employment contract', 'employment agreement', 'job contract', 'offer letter'],
    'nda': ['nda', 'non-disclosure agreement', 'confidentiality agreement'],
    'partnership': ['partnership agreement', 'partnership deed'],
    'sale': ['sale agreement', 'sale deed', 'purchase agreement'],
    'loan': ['loan agreement', 'promissory note'],
    'service': ['service agreement', 'service contract'],
    'freelance': ['freelance contract', 'freelance agreement'],
    'consulting': ['consulting agreement', 'consultancy contract']
};

/**
 * Detect if user wants to generate a document
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Object} Intent detection result
 */
async function detectIntent(userMessage, conversationHistory = []) {
    try {
        const systemPrompt = `You are an intent detection system for a legal document generation platform.

Your task is to determine if the user wants to generate a legal document.

Look for phrases like:
- "generate a [document type]"
- "create a [document type]"
- "I need a [document type]"
- "make a [document type]"
- "draft a [document type]"
- "prepare a [document type]"

Document types include:
- House Rent Agreement / Rental Agreement / Lease Agreement
- Employment Contract / Employment Agreement
- NDA / Non-Disclosure Agreement
- Partnership Agreement
- Sale Agreement
- Loan Agreement
- Service Agreement
- Freelance Contract
- Consulting Agreement

Return a JSON object with:
{
  "hasIntent": true/false,
  "documentType": "house-rent" | "employment" | "nda" | etc. (or null if no intent),
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}

If the user is just asking about documents or discussing them without requesting generation, set hasIntent to false.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Changed from gpt-4 to support JSON response format
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.slice(-5), // Include last 5 messages for context
                { role: 'user', content: userMessage }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const result = JSON.parse(response.choices[0].message.content);

        return {
            success: true,
            hasIntent: result.hasIntent,
            documentType: result.documentType,
            confidence: result.confidence,
            reasoning: result.reasoning
        };

    } catch (error) {
        console.error('Error detecting intent:', error);
        
        // Fallback to simple keyword matching
        const fallbackResult = fallbackIntentDetection(userMessage);
        
        return {
            success: false,
            error: error.message,
            ...fallbackResult,
            usedFallback: true
        };
    }
}

/**
 * Fallback intent detection using keyword matching
 */
function fallbackIntentDetection(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for generation keywords
    const generationKeywords = ['generate', 'create', 'make', 'draft', 'prepare', 'need'];
    const hasGenerationIntent = generationKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (!hasGenerationIntent) {
        return {
            hasIntent: false,
            documentType: null,
            confidence: 0.9
        };
    }
    
    // Try to match document type
    for (const [docType, keywords] of Object.entries(DOCUMENT_TYPES)) {
        for (const keyword of keywords) {
            if (lowerMessage.includes(keyword)) {
                return {
                    hasIntent: true,
                    documentType: docType,
                    confidence: 0.7,
                    reasoning: `Matched keyword: ${keyword}`
                };
            }
        }
    }
    
    // Found generation intent but couldn't identify document type
    return {
        hasIntent: true,
        documentType: null,
        confidence: 0.5,
        reasoning: 'Generation intent detected but document type unclear'
    };
}

/**
 * Get user-friendly document type name
 */
function getDocumentTypeName(documentType) {
    const names = {
        'house-rent': 'House Rent Agreement',
        'employment': 'Employment Contract',
        'nda': 'Non-Disclosure Agreement',
        'partnership': 'Partnership Agreement',
        'sale': 'Sale Agreement',
        'loan': 'Loan Agreement',
        'service': 'Service Agreement',
        'freelance': 'Freelance Contract',
        'consulting': 'Consulting Agreement'
    };
    
    return names[documentType] || documentType;
}

module.exports = {
    detectIntent,
    fallbackIntentDetection,
    getDocumentTypeName,
    DOCUMENT_TYPES
};
