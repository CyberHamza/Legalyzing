const openai = require('../config/openai');

/**
 * Legal Document Intelligence Service
 * Handles classification, summarization, and clause mapping.
 */

/**
 * Classify document type based on content
 * @param {string} text - First 2000 chars of text
 * @returns {Promise<string>} Document type (e.g. 'Bail Petition', 'Agreement')
 */
const classifyDocument = async (text) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a legal expert classifier for Pakistani legal documents.' },
                { role: 'user', content: `Classify this document into one of these categories: [Bail Application, Rent Agreement, Employment Contract, Power of Attorney, Affidavit, FIR, Court Order, Judgment, Other]. Return ONLY the category name.\n\nText:\n${text.substring(0, 1500)}` }
            ],
            temperature: 0
        });
        return response.choices[0].message.content.trim();
    } catch (e) {
        console.error('Classification error:', e);
        return 'Unknown';
    }
};

/**
 * Generate a legal summary
 * @param {string} text - Document text (truncated if needed)
 * @returns {Promise<Object>} Structured summary
 */
const generateSummary = async (text) => {
    try {
        const prompt = `
        Analyze this legal document (Pakistani context) and provide a JSON summary with:
        - facts: Brief background facts
        - legalIssues: List of main legal questions
        - reliefSought: What is being asked?
        - type: Document type
        
        Text:
        ${text.substring(0, 4000)}
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (e) {
        console.error('Summarization error:', e);
        return { error: 'Failed to summarize' };
    }
};

module.exports = {
    classifyDocument,
    generateSummary
};
