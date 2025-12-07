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
async function extractText(buffer, mimeType) {
    if (mimeType === 'application/pdf') {
        return await extractTextFromPDF(buffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await extractTextFromDOCX(buffer);
    } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
}

/**
 * Split text into chunks with overlap for better context preservation
 * This ensures that important context isn't lost at chunk boundaries
 */
function splitIntoChunks(text, maxChars = 1500, overlapChars = 200) {
    const chunks = [];
    
    // Split into sentences more intelligently
    const sentences = text.match(/[^.!?]+[.!?]+[\s"]*/g) || [text];
    
    let currentChunk = '';
    let previousChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        
        // If adding this sentence would exceed max length
        if ((currentChunk + ' ' + sentence).length > maxChars && currentChunk.length > 0) {
            // Save current chunk
            chunks.push(currentChunk.trim());
            
            // Start new chunk with overlap from previous chunk
            // Get last few sentences for context
            const overlapText = currentChunk.slice(-overlapChars);
            previousChunk = currentChunk;
            currentChunk = overlapText + ' ' + sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    
    // Filter out very small chunks (less than 20 chars) to avoid noise
    const validChunks = chunks.filter(chunk => chunk.length >= 20);
    console.log(`Chunking complete: ${chunks.length} raw chunks, ${validChunks.length} valid chunks`);
    return validChunks;
}

/**
 * Generate embeddings for text using OpenAI
 * Configured to output 1024 dimensions to match Pinecone index
 */
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            dimensions: 1024 // Match Pinecone index dimensions
        });
        
        return response.data[0].embedding;
    } catch (error) {
        throw new Error(`Embedding generation failed: ${error.message}`);
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
    
    // Split into chunks
    const textChunks = splitIntoChunks(text, 1000);
    
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
    
    return chunks;
}

module.exports = {
    extractText,
    splitIntoChunks,
    generateEmbedding,
    processDocument
};
