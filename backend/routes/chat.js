const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Document = require('../models/Document');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const openai = require('../config/openai');
const { generateEmbedding } = require('../utils/documentProcessor');
const pineconeService = require('../services/pineconeService');
const { extractFacts } = require('../services/factExtractor');
const { detectIntent, getDocumentTypeName } = require('../services/intentDetector');
const { generateFieldStatusMessage, mapFactsToFields } = require('../services/fieldMapper');

// @route   POST /api/chat
// @desc    Send message and get AI response
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { message, conversationId, documentIds } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        let conversation;

        // Get or create conversation
        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                user: req.user.id
            });

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            // Update documentIds if provided
            if (documentIds && documentIds.length > 0) {
                const existingDocs = conversation.documentIds.map(id => id.toString());
                const newDocs = documentIds.filter(id => !existingDocs.includes(id));
                
                if (newDocs.length > 0) {
                    conversation.documentIds.push(...newDocs);
                }
            }
        } else {
            // Create new conversation
            conversation = new Conversation({
                user: req.user.id,
                messages: [],
                documentIds: documentIds || []
            });
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: message
        };

        if (req.body.files) {
            userMessage.files = req.body.files;
        }

        if (req.body.metadata) {
            userMessage.metadata = req.body.metadata;
        }

        conversation.messages.push(userMessage);

        // Prepare context from documents (Chat-Scoped RAG)
        let context = '';
        let hasDocumentContext = false;
        
        // Always try to retrieve context if we have a conversation ID or specific docs
        
        // --- CONTEXT AUTO-RESOLUTION FIX ---
        // If the frontend didn't send specific documentIds, but we are in a chat session (conversationId),
        // we MUST find all documents associated with this chat to provide full context.
        if ((!documentIds || documentIds.length === 0) && conversationId) {
            console.log('🔍 Auto-resolving documents for Chat ID:', conversationId);
            try {
                // Find all docs linked to this chat
                const chatDocs = await Document.find({ chatId: conversationId }).select('_id');
                if (chatDocs.length > 0) {
                    documentIds = chatDocs.map(d => d._id);
                    console.log(`✅ Auto-resolved ${documentIds.length} documents from session context.`);
                } else {
                    console.log('ℹ️ No documents found for this chat session.');
                }
            } catch (err) {
                console.error('❌ Error resolving chat documents:', err);
            }
        }
        // -----------------------------------

        if (conversationId || (documentIds && documentIds.length > 0)) {
            console.log('📄 Processing RAG for Chat:', conversationId);
            
            let contextParts = [];

            // 1. Fetch Document Metadata & Summaries (High-Level Context)
            // This fixes the "Summarize this" issue by providing guaranteed context even if vector search fails.
            if (documentIds && documentIds.length > 0) {
                const documents = await Document.find({ _id: { $in: documentIds } })
                    .select('filename summary metadata docType');

                if (documents.length > 0) {
                    let summaryContext = '=== DOCUMENT OVERVIEWS (Guaranteed Context) ===\n';
                    documents.forEach(doc => {
                        summaryContext += `\n--- Document: ${doc.filename} ---\n`;
                        summaryContext += `Type: ${doc.docType || 'General Legal Document'}\n`;
                        
                        if (doc.metadata) {
                            if (doc.metadata.parties) summaryContext += `Parties: ${JSON.stringify(doc.metadata.parties)}\n`;
                            if (doc.metadata.court) summaryContext += `Court: ${doc.metadata.court.name || 'N/A'}\n`;
                            if (doc.metadata.dates) summaryContext += `Dates: ${JSON.stringify(doc.metadata.dates)}\n`;
                        }

                        if (doc.summary) {
                            summaryContext += `Summary of Facts: ${doc.summary.facts || 'Not available'}\n`;
                            if (doc.summary.legalIssues?.length) {
                                summaryContext += `Key Legal Issues: ${doc.summary.legalIssues.join(', ')}\n`;
                            }
                            if (doc.summary.reliefSought) {
                                summaryContext += `Relief Sought: ${doc.summary.reliefSought}\n`;
                            }
                        }
                    });
                    summaryContext += '=== END OVERVIEWS ===\n\n';
                    contextParts.push(summaryContext);
                    hasDocumentContext = true; // We have context!
                }
            }

            // 2. Vector Search (Specific Context)
            const queryEmbedding = await generateEmbedding(message);
            const relevantChunks = await pineconeService.queryVectors(
                queryEmbedding,
                8, // top K results
                req.user.id,
                documentIds,
                conversationId
            );

            console.log(`🔍 Found ${relevantChunks.length} relevant chunks from Pinecone`);

            if (relevantChunks.length > 0) {
                let vectorContext = '=== RELEVANT EXCERPTS (Vector Search) ===\n';
                vectorContext += 'The following distinct passages were found via semantic search:\n\n';
                
                relevantChunks.forEach((chunk, index) => {
                    vectorContext += `--- Excerpt ${index + 1} (from "${chunk.documentName}") ---\n`;
                    vectorContext += `${chunk.text}\n\n`;
                });
                
                contextParts.push(vectorContext);
                hasDocumentContext = true;
            }

            if (hasDocumentContext) {
                context = contextParts.join('\n');
            }
        }

        // Check for pending documents
        let hasPendingDocs = false;
        if (documentIds && documentIds.length > 0) {
            const pendingCount = await Document.countDocuments({
                _id: { $in: documentIds },
                processed: false
            });
            if (pendingCount > 0) {
                 hasPendingDocs = true;
                 console.log('⚠️ Request references pending documents');
            }
        }

        // Prepare messages for OpenAI
        const messages = [
            {
                role: 'system',
                content: hasDocumentContext 
                    ? `You are Legalyze AI, an expert legal assistant. You have access to the user's uploaded legal documents.

CRITICAL INSTRUCTIONS:
1. ALWAYS reference the document context when answering questions
2. Quote specific sections when relevant
3. If the answer is in the documents, cite the document name
4. If information is NOT in the documents, clearly state that
5. Provide accurate, professional legal guidance
6. Be concise but thorough

Your primary job is to help users understand their legal documents and answer questions based on their content.`
                    : hasPendingDocs 
                        ? `You are Legalyze AI. The user is asking about a document that is currently being processed by the system.
                           Politely inform them that you cannot read the document yet because it is still analyzing (OCR and Vectorization in progress).
                           Ask them to wait a moment and try again.`
                        : 'You are Legalyze AI, a helpful legal assistant. Provide accurate, professional, and helpful legal responses.'
            }
        ];

        // Add document context as a separate system message if available
        if (context) {
            messages.push({
                role: 'system',
                content: context
            });
        }

        // Add conversation history (last 10 messages for context)
        const recentMessages = conversation.messages.slice(-10);
        messages.push(...recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        })));

        // Get AI response with optimized parameters
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.3, // Lower for more focused, factual responses
            max_tokens: 1500, // Increased for detailed document-based answers
            top_p: 0.9
        });

        const aiResponse = completion.choices[0].message.content;

        // Add AI response to conversation
        conversation.messages.push({
            role: 'assistant',
            content: aiResponse
        });

        // === INTELLIGENT DOCUMENT GENERATION FEATURE ===
        // Extract facts from user message and update user profile
        let extractionResult = null;
        let intentResult = null;
        let generationData = null;

        try {
            // Get user with existing facts
            const user = await User.findById(req.user.id);
            
            // Extract facts from the conversation
            const conversationMessages = conversation.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            
            extractionResult = await extractFacts(conversationMessages, user.extractedFacts || {});
            
            if (extractionResult.success) {
                // Update user's extracted facts
                user.extractedFacts = extractionResult.facts;
                user.factsLastUpdated = new Date();
                await user.save();
                
                console.log('✅ Facts extracted and saved:', extractionResult.newlyExtracted);
            }
            
            // Detect if user wants to generate a document
            intentResult = await detectIntent(message, conversationMessages.slice(-5));
            
            if (intentResult.success && intentResult.hasIntent && intentResult.documentType) {
                console.log(`🎯 Document generation intent detected: ${intentResult.documentType}`);
                
                // Generate field status message
                const fieldStatus = generateFieldStatusMessage(
                    extractionResult.facts,
                    intentResult.documentType
                );
                
                // Map facts to template fields
                const mappedFields = mapFactsToFields(
                    extractionResult.facts,
                    intentResult.documentType
                );
                
                // Prepare generation data to send to frontend
                generationData = {
                    hasGenerationIntent: true,
                    documentType: intentResult.documentType,
                    documentTypeName: getDocumentTypeName(intentResult.documentType),
                    message: fieldStatus.message,
                    completeness: fieldStatus.completeness,
                    mappedFields: mappedFields,
                    canGenerate: fieldStatus.canGenerate
                };
                
                // Override AI response with generation message
                conversation.messages[conversation.messages.length - 1].content = fieldStatus.message;
                conversation.messages[conversation.messages.length - 1].metadata = {
                    generationIntent: true,
                    documentType: intentResult.documentType
                };
            }
            
        } catch (error) {
            console.error('Error in intelligent generation:', error);
            // Don't fail the whole request, just log the error
        }

        // Save conversation
        await conversation.save();

        // Generate title for new conversation
        if (conversation.messages.length <= 2 && conversation.title === 'New Conversation') {
            try {
                const titleCompletion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'Generate a very concise, unique, and professional title (max 4-5 words) for this conversation based on the user message. Do not use quotes.'
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 20
                });

                const newTitle = titleCompletion.choices[0].message.content.trim();
                conversation.title = newTitle;
                await conversation.save();
            } catch (error) {
                console.error('Title generation error:', error);
                // Fallback is already handled by model default or pre-save hook
            }
        }

        res.status(200).json({
            success: true,
            data: {
                conversationId: conversation._id,
                message: conversation.messages[conversation.messages.length - 1].content,
                conversation: {
                    id: conversation._id,
                    title: conversation.title,
                    messages: conversation.messages
                },
                // Include generation data if intent was detected
                ...(generationData && { generation: generationData })
            }
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing chat message',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/chat/conversations
// @desc    Get all user conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            user: req.user.id,
            isActive: true
        })
        .select('title createdAt updatedAt messages')
        .sort({ updatedAt: -1 });

        // Format conversations with message count
        const formattedConversations = conversations.map(conv => ({
            id: conv._id,
            title: conv.title,
            messageCount: conv.messages.length,
            lastMessage: conv.messages[conv.messages.length - 1]?.content.substring(0, 100),
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt
        }));

        res.status(200).json({
            success: true,
            data: formattedConversations
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversations'
        });
    }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get conversation by ID
// @access  Private
router.get('/conversations/:id', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: conversation._id,
                title: conversation.title,
                messages: conversation.messages,
                documentIds: conversation.documentIds,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            }
        });

    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversation'
        });
    }
});

// @route   DELETE /api/chat/conversations/:id
// @desc    Delete conversation
// @access  Private
router.delete('/conversations/:id', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        conversation.isActive = false;
        await conversation.save();

        res.status(200).json({
            success: true,
            message: 'Conversation deleted successfully'
        });

    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting conversation'
        });
    }
});

module.exports = router;
