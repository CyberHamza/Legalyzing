const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const { processDocument } = require('../utils/documentProcessor');
const crypto = require('crypto');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    }
});

// @route   POST /api/documents/upload
// @desc    Upload document to S3 and process
// @access  Private
router.post('/upload', protect, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split('.').pop();
        const uniqueFilename = `${req.user.id}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

        // Upload to S3 with AES-256 encryption
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: uniqueFilename,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ServerSideEncryption: 'AES256', // AES-256 encryption
            Metadata: {
                originalName: req.file.originalname,
                uploadedBy: req.user.id.toString()
            }
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // Generate S3 URL
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFilename}`;

        // Create document record
        const document = new Document({
            user: req.user.id,
            filename: uniqueFilename,
            originalName: req.file.originalname,
            s3Key: uniqueFilename,
            s3Url: s3Url,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            processed: false
        });

        await document.save();

        // Process document asynchronously
        processDocumentAsync(document._id, req.file.buffer, req.file.mimetype);

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully. Processing in background.',
            data: {
                id: document._id,
                filename: document.originalName,
                fileSize: document.fileSize,
                uploadedAt: document.createdAt,
                processed: document.processed
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading document',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Async function to process document
async function processDocumentAsync(documentId, buffer, mimeType) {
    try {
        const document = await Document.findById(documentId);
        if (!document) return;

        // Process document (extract text, chunk, generate embeddings)
        const chunks = await processDocument(buffer, mimeType);

        // Update document with chunks
        document.chunks = chunks;
        document.processed = true;
        await document.save();

        console.log(`✅ Document ${documentId} processed successfully`);

    } catch (error) {
        console.error(`❌ Error processing document ${documentId}:`, error);
        
        // Update document with error
        const document = await Document.findById(documentId);
        if (document) {
            document.processingError = error.message;
            await document.save();
        }
    }
}

// @route   GET /api/documents
// @desc    Get all user documents
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const documents = await Document.find({
            user: req.user.id
        })
        .select('-chunks') // Exclude chunks for list view
        .sort({ createdAt: -1 });

        const formattedDocuments = documents.map(doc => ({
            id: doc._id,
            filename: doc.originalName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            processed: doc.processed,
            processingError: doc.processingError,
            uploadedAt: doc.createdAt
        }));

        res.status(200).json({
            success: true,
            data: formattedDocuments
        });

    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching documents'
        });
    }
});

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: document._id,
                filename: document.originalName,
                fileSize: document.fileSize,
                mimeType: document.mimeType,
                processed: document.processed,
                chunkCount: document.chunks.length,
                uploadedAt: document.createdAt
            }
        });

    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching document'
        });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document from S3 and database
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Delete from S3
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: document.s3Key
        };

        await s3Client.send(new DeleteObjectCommand(deleteParams));

        // Delete from database
        await Document.deleteOne({ _id: document._id });

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting document'
        });
    }
});

module.exports = router;
