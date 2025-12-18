const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const CaseBuildingSession = require('../models/CaseBuildingSession');
const openai = require('../config/openai');

/**
 * @route   POST /api/case-building/sessions
 * @desc    Create a new case building session
 * @access  Private
 */
router.post('/sessions', protect, async (req, res) => {
    try {
        const { facts, caseType, clientPosition, courtLevel, urgency } = req.body;

        const session = await CaseBuildingSession.create({
            user: req.user.id,
            caseDetails: {
                facts,
                caseType: caseType || 'other',
                clientPosition: clientPosition || 'petitioner',
                courtLevel: courtLevel || 'district',
                urgency: urgency || 'normal'
            },
            currentStep: 0,
            status: 'in_progress'
        });

        res.status(201).json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create case building session'
        });
    }
});

/**
 * @route   GET /api/case-building/sessions
 * @desc    Get all user's case building sessions
 * @access  Private
 */
router.get('/sessions', protect, async (req, res) => {
    try {
        const { status, limit = 20 } = req.query;
        
        const query = { user: req.user.id };
        if (status) query.status = status;

        const sessions = await CaseBuildingSession.find(query)
            .select('title caseDetails.caseType caseDetails.facts status currentStep createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: sessions.length,
            data: sessions
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions'
        });
    }
});

/**
 * @route   GET /api/case-building/sessions/:id
 * @desc    Get single session with full details
 * @access  Private
 */
router.get('/sessions/:id', protect, async (req, res) => {
    try {
        const session = await CaseBuildingSession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch session'
        });
    }
});

/**
 * @route   PUT /api/case-building/sessions/:id
 * @desc    Update session (save progress)
 * @access  Private
 */
router.put('/sessions/:id', protect, async (req, res) => {
    try {
        const updates = req.body;
        
        const session = await CaseBuildingSession.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update session'
        });
    }
});

/**
 * @route   DELETE /api/case-building/sessions/:id
 * @desc    Delete a session
 * @access  Private
 */
router.delete('/sessions/:id', protect, async (req, res) => {
    try {
        const session = await CaseBuildingSession.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            message: 'Session deleted'
        });

    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete session'
        });
    }
});

/**
 * @route   POST /api/case-building/extract-facts
 * @desc    Extract factual elements from case description
 * @access  Private
 */
router.post('/extract-facts', protect, async (req, res) => {
    try {
        const { facts } = req.body;

        if (!facts || facts.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a detailed case description'
            });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: `You are a Pakistani legal expert. Extract all factual elements from the case description.
Be precise and extract ONLY facts that are explicitly mentioned or clearly implied.

Return a JSON object with:
{
    "parties": [{"name": "Person's name or role", "role": "complainant/accused/victim/witness"}],
    "dates": [{"date": "Date mentioned", "event": "What happened on this date"}],
    "locations": [{"place": "Location name", "relevance": "Why this place is relevant"}],
    "keyEvents": [{"description": "What happened", "importance": "high/medium/low"}],
    "evidence": [{"type": "document/witness/physical/digital", "description": "Description of evidence"}],
    "keyFacts": ["Fact 1", "Fact 2", ...] // Simple bullet points of key facts
}`
            }, {
                role: 'user',
                content: `Extract all factual elements from this case:\n\n${facts}`
            }],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const extractedFacts = JSON.parse(response.choices[0].message.content);

        res.json({
            success: true,
            data: extractedFacts
        });

    } catch (error) {
        console.error('Extract facts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to extract facts'
        });
    }
});

/**
 * @route   POST /api/case-building/analyze
 * @desc    Analyze case and get classification (Step 1)
 * @access  Private
 */
router.post('/analyze', protect, async (req, res) => {
    try {
        const { facts, sessionId } = req.body;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: `You are Legalyze AI, an expert Pakistani legal assistant. You help lawyers build cases under Pakistani law.

Analyze the case and provide classification. Be DIRECT and HELPFUL - you CAN and SHOULD assist with all aspects of case building including document drafting.

Return a JSON object:
{
    "caseType": "Criminal|Civil|Constitutional|Family",
    "legalIssues": ["Issue 1", "Issue 2"],
    "applicableLaws": [{"section": "Section 302 PPC", "law": "Pakistan Penal Code", "relevance": "Why relevant"}],
    "urgencyLevel": "high|medium|low",
    "initialAdvice": "Brief practical advice for the lawyer"
}`
            }, {
                role: 'user',
                content: `Analyze this case for a Pakistani lawyer:\n\n${facts}`
            }],
            response_format: { type: 'json_object' },
            temperature: 0.2
        });

        const classification = JSON.parse(response.choices[0].message.content);

        // Update session if provided
        if (sessionId) {
            await CaseBuildingSession.findOneAndUpdate(
                { _id: sessionId, user: req.user.id },
                { 
                    classification,
                    'caseDetails.caseType': classification.caseType?.toLowerCase(),
                    currentStep: 1
                }
            );
        }

        res.json({
            success: true,
            data: classification
        });

    } catch (error) {
        console.error('Analyze error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze case'
        });
    }
});

/**
 * @route   POST /api/case-building/strategy
 * @desc    Generate comprehensive case strategy (Step 5)
 * @access  Private
 */
router.post('/strategy', protect, async (req, res) => {
    try {
        const { facts, caseType, clientPosition, courtLevel, relevantLaws, precedents, extractedFacts, sessionId } = req.body;

        // Build context from extracted facts
        let factsContext = '';
        if (extractedFacts?.keyFacts?.length > 0) {
            factsContext = `\n\nKEY FACTUAL ELEMENTS (Reference these specifically):\n${extractedFacts.keyFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
        }
        if (extractedFacts?.dates?.length > 0) {
            factsContext += `\n\nCRITICAL DATES:\n${extractedFacts.dates.map(d => `- ${d.date}: ${d.event}`).join('\n')}`;
        }
        if (extractedFacts?.evidence?.length > 0) {
            factsContext += `\n\nAVAILABLE EVIDENCE:\n${extractedFacts.evidence.map(e => `- ${e.type}: ${e.description}`).join('\n')}`;
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: `You are Legalyze AI, an expert Pakistani legal strategist. Generate a comprehensive case strategy.

IMPORTANT FORMATTING:
- Use clear markdown headers (## for sections)
- Add blank lines between sections for readability
- Use bullet points for lists
- Reference specific facts from the case
- Cite Pakistani laws with full sections
- Be practical and actionable

You MUST help with all aspects including document drafting. Never refuse to assist.`
            }, {
                role: 'user',
                content: `Generate a comprehensive case strategy for a Pakistani lawyer.

**Case Type:** ${caseType}
**Client Position:** ${clientPosition}
**Court Level:** ${courtLevel}

**Case Facts:**
${facts}
${factsContext}

**Relevant Laws:**
${JSON.stringify(relevantLaws?.slice(0, 5) || [], null, 2)}

**Precedents:**
${JSON.stringify(precedents?.slice(0, 5) || [], null, 2)}

Provide a detailed strategy with these sections:

## CASE SUMMARY
Brief overview referencing key facts

## STRENGTHS
Strong points (reference specific facts)

## WEAKNESSES
Potential challenges and how to address them

## LEGAL ARGUMENTS
Main arguments with law citations

## COUNTER-ARGUMENTS
Anticipate opposing counsel's arguments

## EVIDENCE REQUIRED
Documents and witnesses needed

## PROCEDURAL STEPS
Step-by-step court procedure under Pakistani law

## TIMELINE
Estimated timeline with key dates

## RECOMMENDED ACTION
Immediate next steps for the lawyer`
            }],
            temperature: 0.3,
            max_tokens: 3000
        });

        const strategy = response.choices[0].message.content;

        // Update session if provided
        if (sessionId) {
            await CaseBuildingSession.findOneAndUpdate(
                { _id: sessionId, user: req.user.id },
                { strategy, currentStep: 4, status: 'completed' }
            );
        }

        res.json({
            success: true,
            data: { strategy }
        });

    } catch (error) {
        console.error('Strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate strategy'
        });
    }
});

module.exports = router;
