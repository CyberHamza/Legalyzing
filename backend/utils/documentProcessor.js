const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const openai = require('../config/openai');

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer) {
    // Mock for testing RAG flow without valid PDF binaries
    if (buffer.toString().startsWith('%MOCK-PDF')) {
        console.log('📝 Detected Mock PDF for testing');
        return buffer.toString().replace('%MOCK-PDF', '').trim();
    }

    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        throw new Error(`PDF extraction failed: ${error.message}`);
    }
}

/**
 * Extract text from DOCX buffer
 */
async function extractTextFromDOCX(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        throw new Error(`DOCX extraction failed: ${error.message}`);
    }
}

/**
 * Extract text based on file type
 */
const { extractTextFromImage } = require('../services/ocrService');
const { splitTextStructurally } = require('../services/structureAwareChunker');

/**
 * Extract text based on file type
 */
async function extractText(buffer, mimeType) {
    if (mimeType === 'application/pdf') {
        return await extractTextFromPDF(buffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await extractTextFromDOCX(buffer);
    } else if (mimeType.startsWith('image/')) {
        return await extractTextFromImage(buffer);
    } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
            dimensions: 1024,
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

/**
 * Process document: extract text, chunk, and generate embeddings
 */
async function processDocument(buffer, mimeType) {
    // Extract text
    const text = await extractText(buffer, mimeType);
    
    if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from document');
    }
    
    // Split into chunks using Structure Aware Chunker
    const textChunks = splitTextStructurally(text);
    
    // Generate embeddings for each chunk
    const chunks = [];
    for (let i = 0; i < textChunks.length; i++) {
        const embedding = await generateEmbedding(textChunks[i]);
        chunks.push({
            text: textChunks[i],
            embedding,
            chunkIndex: i
        });
    }
    
    return { chunks, text };
}

module.exports = {
    extractText,
    generateEmbedding,
    processDocument
};
