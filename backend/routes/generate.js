const express = require('express');
const router = express.Router();
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const { protect } = require('../middleware/auth');
const GeneratedDocument = require('../models/GeneratedDocument');
const { generateRentAgreementPDF } = require('../utils/pdfGenerator');

// @route   POST /api/generate/rent-agreement
// @desc    Generate House Rent Agreement PDF
// @access  Private
router.post('/rent-agreement', protect, async (req, res) => {
    try {
        const formData = req.body;
        
        // Validate required fields
        const requiredFields = [
            'dateOfAgreement', 'landlordName', 'landlordFatherName', 'landlordAddress',
            'companyName', 'directorName', 'propertyAddress', 'monthlyRent',
            'leaseStartDate', 'signingPlace', 'signingDate'
        ];
        
        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        
        console.log('Generating PDF for user:', req.user.email);
        
        // Generate PDF
        const pdfBuffer = await generateRentAgreementPDF(formData);
        
        // Create unique filename
        const timestamp = Date.now();
        const fileName = `Rent_Agreement_${formData.companyName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
        const s3Key = `generated-documents/${req.user._id}/${fileName}`;
        
        console.log('Uploading to S3:', s3Key);
        
        // Upload to S3 with encryption
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ServerSideEncryption: 'AES256', // Server-side encryption
            Metadata: {
                userId: req.user._id.toString(),
                documentType: 'rent-agreement',
                generatedAt: new Date().toISOString()
            }
        });
        
        await s3Client.send(uploadCommand);
        
        // Generate S3 URL
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        
        console.log('PDF uploaded successfully:', s3Url);
        
        // Save document metadata to database
        const generatedDocument = new GeneratedDocument({
            userId: req.user._id,
            documentType: 'rent-agreement',
            fileName,
            s3Key,
            s3Url,
            formData,
            fileSize: pdfBuffer.length,
            status: 'completed'
        });
        
        await generatedDocument.save();
        
        console.log('Document metadata saved to database');
        
        // Generate signed URL for immediate viewing
        const signedUrl = await generatedDocument.getSignedUrl();
        
        res.status(201).json({
            success: true,
            message: 'Document generated successfully',
            document: {
                id: generatedDocument._id,
                fileName,
                documentType: 'rent-agreement',
                fileSize: pdfBuffer.length,
                createdAt: generatedDocument.createdAt,
                signedUrl // For immediate viewing
            }
        });
        
    } catch (error) {
        console.error('Document generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate document',
            error: error.message
        });
    }
});

// @route   GET /api/generate/documents
// @desc    Get all generated documents for logged in user
// @access  Private
router.get('/documents', protect, async (req, res) => {
    try {
        const documents = await GeneratedDocument.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .select('-formData'); // Exclude form data from list
        
        // Generate signed URLs for all documents
        const documentsWithUrls = await Promise.all(
            documents.map(async (doc) => {
                const signedUrl = await doc.getSignedUrl();
                return {
                    id: doc._id,
                    fileName: doc.fileName,
                    documentType: doc.documentType,
                    fileSize: doc.fileSize,
                    createdAt: doc.createdAt,
                    status: doc.status,
                    signedUrl
                };
            })
        );
        
        res.status(200).json({
            success: true,
            count: documentsWithUrls.length,
            documents: documentsWithUrls
        });
        
    } catch (error) {
        console.error('Fetch documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
            error: error.message
        });
    }
});

// @route   GET /api/generate/documents/:id
// @desc    Get specific generated document
// @access  Private
router.get('/documents/:id', protect, async (req, res) => {
    try {
        const document = await GeneratedDocument.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        
        // Generate signed URL
        const signedUrl = await document.getSignedUrl();
        
        res.status(200).json({
            success: true,
            document: {
                id: document._id,
                fileName: document.fileName,
                documentType: document.documentType,
                fileSize: document.fileSize,
                createdAt: document.createdAt,
                status: document.status,
                signedUrl
            }
        });
        
    } catch (error) {
        console.error('Fetch document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document',
            error: error.message
        });
    }
});

// @route   DELETE /api/generate/documents/:id
// @desc    Delete generated document
// @access  Private
router.delete('/documents/:id', protect, async (req, res) => {
    try {
        const document = await GeneratedDocument.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        
        // Delete from S3 only if document has S3 key (for PDF documents)
        if (document.s3Key) {
            try {
                await GeneratedDocument.deleteFromS3(document.s3Key);
            } catch (s3Error) {
                console.warn('S3 deletion failed (document might be HTML-only):', s3Error.message);
                // Continue with database deletion even if S3 deletion fails
            }
        }
        
        // Delete from database
        await document.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message
        });
    }
});

// @route   GET /api/generate/documents/:id/html
// @desc    Serve HTML content of generated document
// @access  Private
router.get('/documents/:id/html', protect, async (req, res) => {
    try {
        const document = await GeneratedDocument.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).send('<html><body><h1>Document not found</h1></body></html>');
        }
        
        // Serve the HTML content
        res.set('Content-Type', 'text/html');
        res.send(document.htmlContent || '<html><body><h1>Document content not available</h1></body></html>');
        
    } catch (error) {
        console.error('Serve HTML error:', error);
        res.status(500).send('<html><body><h1>Error loading document</h1></body></html>');
    }
});

module.exports = router;
