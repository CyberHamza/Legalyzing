const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    },
    chunkIndex: {
        type: Number,
        required: true
    }
});

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
        chunks: [chunkSchema],
        processed: {
            type: Boolean,
            default: false
        },
        processingError: String
    },
    {
        timestamps: true,
        collection: 'documents'
    }
);

// Index for vector search
documentSchema.index({ 'chunks.embedding': 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
