const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        filename: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        s3Key: {
            type: String,
            required: true,
            unique: true
        },
        s3Url: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        mimeType: {
            type: String,
            required: true,
            enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        },
        chunkCount: {
            type: Number,
            default: 0
        },
        processed: {
            type: Boolean,
            default: false
        },
        pineconeIndexed: {
            type: Boolean,
            default: false
        },
        processingError: String,
        
        // Intelligence Data
        docType: String,
        summary: {
            facts: String,
            legalIssues: [String],
            reliefSought: String
        },
        extractedText: String, // Store full text for persistence
        
        // Context
        chatId: {
            type: String,
            index: true
        }
    },
    {
        timestamps: true,
        collection: 'documents'
    }
);

// Index for user queries
documentSchema.index({ user: 1, processed: 1, pineconeIndexed: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
