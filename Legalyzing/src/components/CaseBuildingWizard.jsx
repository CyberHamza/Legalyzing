import React, { useState, useEffect } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepButton,
    StepLabel,
    Button,
    Typography,
    TextField,
    Paper,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tooltip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Container,
    Grid,
    Avatar
} from '@mui/material';
import {
    Gavel,
    Assignment,
    Search,
    Description,
    CheckCircle,
    ExpandMore,
    Lightbulb,
    Balance,
    Article,
    School,
    ArrowForward,
    ArrowBack,
    ContentCopy,
    Download,
    Close,
    History,
    Save,
    Delete,
    PictureAsPdf
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const STEPS = [
    { label: 'Case Intake', description: 'Describe the facts of your case' },
    { label: 'Classification', description: 'Identify case type and issues' },
    { label: 'Relevant Law', description: 'Find applicable Pakistani statutes' },
    { label: 'Precedents', description: 'Find Supreme Court judgments' },
    { label: 'Strategy', description: 'Generate case strategy' },
    { label: 'Drafting', description: 'Generate legal documents' }
];

const API_BASE = 'http://127.0.0.1:5000';

const CaseBuildingWizard = ({ onClose }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    
    // History View State
    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState([]);
    
    // Case data
    const [caseData, setCaseData] = useState({
        facts: '',
        caseType: '',
        clientPosition: 'petitioner',
        courtLevel: 'district',
        urgency: 'normal',
        extractedFacts: null,
        classification: null,
        relevantLaws: [],
        precedents: [],
        strategy: null,
        documents: []
    });

    // Tracking searches for UX feedback
    const [searchMetadata, setSearchMetadata] = useState({
        lawsSearched: false,
        precedentsSearched: false,
        lastLawQuery: '',
        lastPrecedentQuery: ''
    });

    const [statusMessage, setStatusMessage] = useState('');
    const [searchSummary, setSearchSummary] = useState('');
    const [stepAck, setStepAck] = useState({ show: false, message: '' });

    // --- History Management ---
    const fetchSessions = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/case-building/sessions`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                setSessions(data.data);
                setShowHistory(true);
            }
        } catch (err) {
            console.error('Failed to fetch sessions');
        }
    };

    const loadSession = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/case-building/sessions/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                const session = data.data;
                setSessionId(session._id);
                setCaseData({
                    facts: session.caseDetails.facts || '',
                    caseType: session.caseDetails.caseType || '',
                    clientPosition: session.caseDetails.clientPosition || 'petitioner',
                    courtLevel: session.caseDetails.courtLevel || 'district',
                    urgency: session.caseDetails.urgency || 'normal',
                    extractedFacts: session.extractedFacts,
                    classification: session.classification,
                    relevantLaws: session.relevantLaws || [],
                    precedents: session.precedents || [],
                    strategy: session.strategy,
                    documents: session.documents || []
                });
                setActiveStep(session.currentStep || (session.classification ? 1 : 0));
                
                // Set metadata to unblock navigation if data already exists
                setSearchMetadata({
                    lawsSearched: session.relevantLaws && session.relevantLaws.length > 0,
                    precedentsSearched: session.precedents && session.precedents.length > 0,
                    lastLawQuery: 'Restored from session',
                    lastPrecedentQuery: 'Restored from session'
                });
                if (session.searchSummary) {
                    setSearchSummary(session.searchSummary);
                }
                
                setShowHistory(false);
            }
        } catch (err) {
            setError('Failed to load session');
        } finally {
            setLoading(false);
        }
    };

    const deleteSession = async (e, id) => {
        e.stopPropagation();
        if(!window.confirm('Are you sure you want to delete this case?')) return;
        
        try {
            await fetch(`${API_BASE}/api/case-building/sessions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setSessions(prev => prev.filter(s => s._id !== id));
        } catch (err) {
            console.error('Failed to delete session');
        }
    };

    // --- Persist Progress ---
    const persistSession = async (currentData, step) => {
        try {
            const url = sessionId 
                ? `${API_BASE}/api/case-building/sessions/${sessionId}`
                : `${API_BASE}/api/case-building/sessions`;
            
            const method = sessionId ? 'PUT' : 'POST';
            
            const payload = {
                currentStep: step,
                ...(method === 'POST' && {
                    facts: currentData.facts,
                    caseType: currentData.caseType,
                    clientPosition: currentData.clientPosition,
                    courtLevel: currentData.courtLevel,
                    urgency: currentData.urgency
                }),
                ...(method === 'PUT' && {
                    caseDetails: {
                        facts: currentData.facts,
                        caseType: currentData.caseType,
                        clientPosition: currentData.clientPosition,
                        courtLevel: currentData.courtLevel,
                        urgency: currentData.urgency
                    },
                    extractedFacts: currentData.extractedFacts,
                    classification: currentData.classification,
                    relevantLaws: currentData.relevantLaws,
                    precedents: currentData.precedents
                })
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success && method === 'POST') {
                setSessionId(data.data._id);
                return data.data._id;
            }
        } catch (err) {
            console.error('Failed to save progress', err);
        }
    };

    // --- Step 1: Case Intake & Analysis ---
    const handleAnalysis = async () => {
        if (!caseData.facts.trim()) {
            setError('Please describe the facts of your case');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const newSessionId = await persistSession(caseData, 0);
            const currentSessionId = sessionId || newSessionId;

            const factsRes = await fetch(`${API_BASE}/api/case-building/extract-facts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ facts: caseData.facts })
            });
            const factsData = await factsRes.json();
            const extractedFacts = factsData.success ? factsData.data : null;

            const analyzeRes = await fetch(`${API_BASE}/api/case-building/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    facts: caseData.facts,
                    sessionId: currentSessionId
                })
            });
            const analyzeData = await analyzeRes.json();

            if (analyzeData.success) {
                const analysis = analyzeData.data;
                const newData = {
                    ...caseData,
                    extractedFacts,
                    classification: analysis,
                    caseType: analysis.caseType?.toLowerCase() || 'civil'
                };
                
                setCaseData(newData);
                
                await fetch(`${API_BASE}/api/case-building/sessions/${currentSessionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        extractedFacts,
                        classification: analysis,
                        currentStep: 1
                    })
                });

                setStepAck({ show: true, message: 'Analysis Complete! Auto-advancing...' });
                setTimeout(() => {
                    setStepAck({ show: false, message: '' });
                    setActiveStep(1);
                }, 1500);
            }
        } catch (err) {
            setError('Failed to analyze case. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 2: Relevant Laws ---
    const handleFindLaws = async () => {
        setLoading(true);
        setStatusMessage('Please wait, we are identifying applicable Pakistani statutes for your case...');
        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: `List detailed Pakistani laws for this ${caseData.caseType} case.
                    
FACTS: ${caseData.facts}

Return JSON array: [{"section": "...", "law": "...", "description": "...", "relevance": "..."}]`
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            setSearchMetadata(prev => ({ ...prev, lawsSearched: true, lastLawQuery: caseData.facts.substring(0, 100) + '...' }));

            const data = await response.json();
            if (data.success) {
                let laws = [];
                try {
                    laws = JSON.parse(data.data.message);
                } catch {
                    laws = [{ description: data.data.message }];
                }
                
                setCaseData(prev => ({ ...prev, relevantLaws: laws }));
                await persistSession({ ...caseData, relevantLaws: laws }, 2);
                
                setStepAck({ show: true, message: 'Laws Identified! Moving to Precedents...' });
                setTimeout(() => {
                    setStepAck({ show: false, message: '' });
                    setActiveStep(3);
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to search laws');
            }
        } catch (err) {
            console.error('Law search error:', err);
            setError(`Failed to find laws: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Step 3: Precedents ---
    const handleFindPrecedents = async () => {
        setLoading(true);
        setStatusMessage('Initializing Deep AI Legal Search... We are scanning thousands of precedents.');
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/judgments/intelligent-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    query: caseData.facts,
                    caseType: caseData.caseType,
                    limit: 5
                })
            });

            if (!response.ok) throw new Error('Intelligent search service currently unavailable');

            const data = await response.json();

            setSearchMetadata(prev => ({ 
                ...prev, 
                precedentsSearched: true, 
                lastPrecedentQuery: caseData.facts.substring(0, 100) + '...' 
            }));

            if (data.success) {
                const results = data.data?.results || [];
                const summary = data.data?.summary || '';
                
                setCaseData(prev => ({ ...prev, precedents: results }));
                setSearchSummary(summary);
                await persistSession({ ...caseData, precedents: results, searchSummary: summary }, 3);
                
                setStepAck({ show: true, message: 'Precedents Found! Building Strategy...' });
                setTimeout(() => {
                    setStepAck({ show: false, message: '' });
                    setActiveStep(4);
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to complete intelligent search');
            }
        } catch (err) {
            console.error('Intelligent Search Error:', err);
            setError(`Search error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Step 4: Strategy ---
    const handleGenerateStrategy = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/case-building/strategy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...caseData,
                    sessionId
                })
            });

            const data = await response.json();
            if (data.success) {
                setCaseData(prev => ({ ...prev, strategy: data.data.strategy }));
                setStepAck({ show: true, message: 'Strategy Memorandum Generated! Proceeding to document drafting?' });
                setTimeout(() => {
                    setStepAck({ show: false, message: '' });
                }, 3000);
            }
        } catch (err) {
            setError('Failed to generate strategy');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 5: Documents ---
    const handleGenerateDocuments = async () => {
    setLoading(true);
    setStatusMessage('Please wait, we are drafting your professional legal petition following High Court standards...');
    try {
        const docType = caseData.caseType === 'criminal' ? 'Bail Application' :
                       caseData.caseType === 'constitutional' ? 'Writ Petition' :
                       caseData.caseType === 'family' ? 'Family Court Application' :
                       'Civil Suit';

        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                message: `Draft a professional ${docType} for the High Court in Pakistan.
                
                **CASE PARAMETERS:**
                Facts: ${caseData.facts}
                Client Position: ${caseData.clientPosition}
                Target Court: ${caseData.courtLevel}
                Relevant Laws: ${caseData.relevantLaws.map(l => l.section).join(', ')}
                
                **STRICT TEMPLATE (Pakistan High Court Standard):**
                1. COURT HEADING (e.g. IN THE LAHORE HIGH COURT)
                2. CASE NUMBER (Placeholder)
                3. PARTIES (Petitioner vs Respondent)
                4. NATURE OF PETITION (e.g. "Under Article 199...")
                5. RESPECTFULLY SHOWETH (Facts in paragraphs)
                6. GROUNDS (Legal arguments)
                7. PRAYER (Relief sought)
                8. VERIFICATION & AFFIDAVIT
                
                Use standard Pakistani legal terminology. Be authoritative and detailed.`
            })
        });

        const data = await response.json();
        if (data.success) {
            const newDoc = { type: docType, content: data.data.message };
            setCaseData(prev => ({
                ...prev,
                documents: [...prev.documents, newDoc]
            }));
            await persistSession({ ...caseData, documents: [...caseData.documents, newDoc] }, 5);
            setStepAck({ show: true, message: 'Final Document Ready!' });
            setTimeout(() => {
                setStepAck({ show: false, message: '' });
            }, 3000);
        }
    } catch (err) {
        setError('Failed to generate documents');
    } finally {
        setLoading(false);
    }
};

    const handleExportDocumentPDF = async (index) => {
        try {
            const response = await fetch(`${API_BASE}/api/case-building/sessions/${sessionId}/documents/${index}/export`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to export PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Legal_Document_${caseData.documents[index].type.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('Failed to export document as PDF');
        }
    };

    const handleDownloadPDF = async () => {
        const url = `${API_BASE}/api/case-building/sessions/${sessionId}/export`;
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `Legal_Strategy_${sessionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            setError('Failed to download PDF');
        }
    };

    return (
        <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* Header Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" color="primary.main" sx={{ mb: 0.5 }}>
                        Case Building Wizard
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Gavel fontSize="small" color="primary" /> Professional Pakistani Legal Strategy & Compliance Engine
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button 
                        startIcon={<History />} 
                        variant="outlined" 
                        onClick={fetchSessions}
                    >
                        History
                    </Button>
                    <IconButton onClick={onClose}><Close /></IconButton>
                </Stack>
            </Box>

            {/* Error Banner */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* History Dialog */}
            <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
                <DialogTitle>Recent Sessions</DialogTitle>
                <DialogContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Case Title</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session._id} hover sx={{ cursor: 'pointer' }} onClick={() => loadSession(session._id)}>
                                    <TableCell>{new Date(session.updatedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="bold">{session.title || 'Untitled Case'}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                            {session.caseDetails?.facts?.substring(0, 50)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Chip label={session.status} size="small" /></TableCell>
                                    <TableCell><Chip label={session.caseDetails?.caseType} variant="outlined" size="small" /></TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={(e) => deleteSession(e, session._id)} color="error">
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowHistory(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Main Stepper - Horizontal */}
            <Box sx={{ mb: 6 }}>
                <Stepper activeStep={activeStep} orientation="horizontal" alternativeLabel>
                    {STEPS.map((step, index) => (
                        <Step key={step.label} completed={activeStep > index}>
                            <StepButton onClick={() => setActiveStep(index)}>
                                <StepLabel>{step.label}</StepLabel>
                            </StepButton>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Step Content Area */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {stepAck.show && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    marginBottom: '20px'
                                }}
                            >
                                <Alert 
                                    icon={<CheckCircle fontSize="inherit" />} 
                                    severity="success"
                                    sx={{ 
                                        borderRadius: 2, 
                                        bgcolor: 'success.main', 
                                        color: 'white',
                                        '& .MuiAlert-icon': { color: 'white' }
                                    }}
                                >
                                    {stepAck.message}
                                </Alert>
                            </motion.div>
                        )}
                        {/* Step 0: Intake */}
                        {activeStep === 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h5" fontWeight="bold">1. Case Facts & Parameters</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={10}
                                    label="Provide Detailed Case Facts"
                                    placeholder="Include names, dates, specific incidents, and the current legal status..."
                                    value={caseData.facts}
                                    onChange={(e) => setCaseData(p => ({ ...p, facts: e.target.value }))}
                                    variant="outlined"
                                    sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                                />

                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Client Position</InputLabel>
                                            <Select 
                                                value={caseData.clientPosition}
                                                label="Client Position"
                                                onChange={(e) => setCaseData(p => ({ ...p, clientPosition: e.target.value }))}
                                            >
                                                <MenuItem value="petitioner">Petitioner/Plaintiff</MenuItem>
                                                <MenuItem value="respondent">Respondent/Defendant</MenuItem>
                                                <MenuItem value="appellant">Appellant</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Court Level</InputLabel>
                                            <Select 
                                                value={caseData.courtLevel}
                                                label="Court Level"
                                                onChange={(e) => setCaseData(p => ({ ...p, courtLevel: e.target.value }))}
                                            >
                                                <MenuItem value="district">District/Magistrate</MenuItem>
                                                <MenuItem value="sessions">Sessions Court</MenuItem>
                                                <MenuItem value="highcourt">High Court</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={handleAnalysis}
                                            disabled={loading || !caseData.facts.trim()}
                                            sx={{ height: '56px', borderRadius: 2 }}
                                        >
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Start Analysis'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Step 1: Classification */}
                        {activeStep === 1 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h5" fontWeight="bold">2. Case Analysis & Issues</Typography>
                                {caseData.classification ? (
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={4}>
                                            <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                                <CardContent>
                                                    <Typography variant="overline" color="text.secondary">Case Identity</Typography>
                                                    <Typography variant="h6" fontWeight="bold" gutterBottom>{caseData.classification.caseType}</Typography>
                                                    <Chip 
                                                        label={caseData.classification.urgencyLevel} 
                                                        color={caseData.classification.urgencyLevel === 'high' ? 'error' : 'info'} 
                                                        sx={{ mb: 2 }}
                                                    />
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="subtitle2" fontWeight="bold">Initial Advice:</Typography>
                                                    <Typography variant="body2">{caseData.classification.initialAdvice}</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={8}>
                                            <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'background.paper' }}>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>Legal Issues Identified</Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                                                    {caseData.classification.legalIssues?.map((issue, i) => (
                                                        <Chip key={i} label={issue} variant="soft" color="primary" />
                                                    ))}
                                                </Box>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>Key Factual Elements</Typography>
                                                <List>
                                                    {caseData.extractedFacts?.keyFacts?.map((fact, i) => (
                                                        <ListItem key={i}>
                                                            <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                                                            <ListItemText primary={fact} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Alert severity="info">Please complete Step 1 first.</Alert>
                                )}
</Box>
                        )}

                        {/* Step 2: Laws */}
                        {activeStep === 2 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">3. Statutory Framework</Typography>
                                        <Typography variant="body2" color="text.secondary">Applicable Statutes from the Constitution, PPC, CrPC & CPC</Typography>
                                    </Box>
                                    {caseData.relevantLaws.length > 0 && !loading && (
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<Search />} 
                                            onClick={handleFindLaws}
                                        >
                                            Re-Scan Laws
                                        </Button>
                                    )}
                                </Box>
                                
                                <AnimatePresence mode="wait">
                                    {caseData.relevantLaws.length === 0 && !loading ? (
                                        <motion.div
                                            key="search-cta"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.05 }}
                                        >
                                            <Paper 
                                                sx={{ 
                                                    p: 8, 
                                                    textAlign: 'center', 
                                                    borderRadius: 4, 
                                                    bgcolor: 'rgba(25, 118, 210, 0.04)', 
                                                    border: '2px dashed', 
                                                    borderColor: 'primary.light',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Gavel sx={{ fontSize: 80, mb: 3, color: 'primary.main', opacity: 0.8 }} />
                                                <Typography variant="h5" gutterBottom fontWeight="800">
                                                    Identify Legal Foundations
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
                                                    Our engine will perform a cross-referential search across the entire Pakistani legal corpus to find the exact sections relevant to your case.
                                                </Typography>
                                                <Button 
                                                    variant="contained" 
                                                    size="large"
                                                    startIcon={<Search />} 
                                                    onClick={handleFindLaws}
                                                    sx={{ borderRadius: '50px', px: 10, py: 2, fontSize: '1.1rem', fontWeight: 'bold', boxShadow: 4 }}
                                                >
                                                    Commence Legal Scan
                                                </Button>
                                            </Paper>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="results-dashboard"
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Grid container spacing={3}>
                                                {loading ? (
                                                    <Grid item xs={12} sx={{ textAlign: 'center', py: 10 }}>
                                                        <CircularProgress size={60} thickness={4} />
                                                        <Typography variant="h6" sx={{ mt: 3, fontWeight: 'medium' }} color="primary">
                                                            {statusMessage || 'Analyzing legal corpus...'}
                                                        </Typography>
                                                    </Grid>
                                                ) : (
                                                    <>
                                                        <Grid item xs={12}>
                                                            <Paper sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, shadow: 3 }}>
                                                                <CheckCircle />
                                                                <Typography variant="subtitle1" fontWeight="bold">
                                                                    Intelligence Scan Complete: {caseData.relevantLaws.length} Statutes Identified
                                                                </Typography>
                                                            </Paper>
                                                        </Grid>
                                                        
                                                        {caseData.relevantLaws.map((law, i) => (
                                                            <Grid item xs={12} md={6} key={i}>
                                                                <Card 
                                                                    elevation={0} 
                                                                    sx={{ 
                                                                        borderRadius: 3, 
                                                                        border: '1px solid', 
                                                                        borderColor: 'divider',
                                                                        height: '100%',
                                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                                        '&:hover': {
                                                                            transform: 'translateY(-4px)',
                                                                            boxShadow: 4,
                                                                            borderColor: 'primary.main'
                                                                        }
                                                                    }}
                                                                >
                                                                    <CardContent sx={{ p: 3 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                                §
                                                                            </Avatar>
                                                                            <Typography variant="h6" color="primary" fontWeight="800">
                                                                                {law.section || law.law}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography variant="body2" sx={{ mb: 2, color: 'text.primary', lineHeight: 1.7 }}>
                                                                            {law.description}
                                                                        </Typography>
                                                                        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                                            <Lightbulb sx={{ fontSize: 18, mt: 0.3, color: 'warning.main' }} />
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                                                                                <strong>APPLICATION:</strong> {law.relevance}
                                                                            </Typography>
                                                                        </Box>
                                                                    </CardContent>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                    </>
                                                )}
                                            </Grid>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Box>
                        )}

                        {/* Step 3: Precedents */}
                        {activeStep === 3 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h5" fontWeight="bold">4. Supreme Court Precedents</Typography>
                                
                                {caseData.precedents.length === 0 && !loading ? (
                                    <Paper 
                                        sx={{ 
                                            p: 6, 
                                            textAlign: 'center', 
                                            borderRadius: 4, 
                                            bgcolor: 'action.hover', 
                                            border: '2px dashed', 
                                            borderColor: 'secondary.main', 
                                            opacity: 0.9
                                        }}
                                    >
                                        <Balance sx={{ fontSize: 60, mb: 2, color: 'secondary.main', opacity: 0.5 }} />
                                        <Typography variant="h6" gutterBottom fontWeight="bold">
                                            Establish Stare Decisis
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                                            Search thousands of Supreme Court and High Court judgments to find matching ratios that support your client's position.
                                        </Typography>
                                        <Button 
                                            variant="contained" 
                                            color="secondary"
                                            size="large"
                                            startIcon={<Search />} 
                                            onClick={handleFindPrecedents}
                                            sx={{ borderRadius: 3, px: 6, py: 1.5 }}
                                        >
                                            Search Case Law Database
                                        </Button>
                                    </Paper>
                                ) : (
                                    <Stack spacing={3}>
                                        <Paper sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, shadow: 3 }}>
                                            <CheckCircle fontSize="small" />
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {statusMessage || `Intelligent Search Complete: Found ${caseData.precedents.length} Mandatory Precedents.`}
                                            </Typography>
                                        </Paper>
                                        
                                        {searchSummary && (
                                            <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 3, borderLeft: '6px solid', borderColor: 'primary.main' }}>
                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Intelligence Summary:</Typography>
                                                <Typography variant="body2">{searchSummary}</Typography>
                                            </Paper>
                                        )}
                                        {searchMetadata.lastPrecedentQuery && (
                                            <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                                                <strong>AI Legal Scan Query:</strong> {searchMetadata.lastPrecedentQuery}
                                            </Alert>
                                        )}
                                        {caseData.precedents.length === 0 && !loading && (
                                            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 3 }}>
                                                <Typography color="text.secondary" gutterBottom>
                                                    No direct precedents found for this specific factual query in our current index.
                                                </Typography>
                                                <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                                                    The AI Strategist can still build a case based on statutory laws in the next step.
                                                </Typography>
                                                <Button variant="outlined" color="secondary" onClick={handleFindPrecedents}>Try broader search</Button>
                                            </Paper>
                                        )}
                                        <Grid container spacing={3}>
                                            {caseData.precedents?.map((p, i) => (
                                                <Grid item xs={12} key={i}>
                                                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
                                                        {p.priority && (
                                                            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: p.priority === 1 ? 'error.main' : 'primary.main' }} />
                                                        )}
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                            <Box>
                                                                <Typography variant="h6" color="secondary.main" fontWeight="bold">{p.caseTitle || p.caseName}</Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>{p.citation}</Typography>
                                                            </Box>
                                                            <Stack direction="row" spacing={1}>
                                                                {p.matchType && (
                                                                    <Chip 
                                                                        label={p.matchType.toUpperCase()} 
                                                                        size="small" 
                                                                        variant="outlined"
                                                                        sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}
                                                                    />
                                                                )}
                                                                <Chip label="MANDATORY" size="small" color="secondary" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }} />
                                                            </Stack>
                                                        </Box>
                                                        
                                                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">Ratio Decidendi:</Typography>
                                                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{p.ratio}</Typography>
                                                        </Box>

                                                        {p.matchReason && (
                                                            <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'secondary.main' }}>
                                                                <Typography variant="caption" fontWeight="bold" display="block" color="secondary.contrastText">⚖️ STRATEGIC RELEVANCE (AI Analysis):</Typography>
                                                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'secondary.contrastText' }}>{p.matchReason}</Typography>
                                                            </Box>
                                                        )}

                                                        <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px dotted', borderColor: 'divider' }}>
                                                            <Typography variant="caption" color="text.secondary"><strong>Application:</strong> {p.application}</Typography>
                                                            {p.searchScore && (
                                                                <Typography variant="caption" color="text.secondary"><strong>Match Confidence:</strong> {(parseFloat(p.searchScore) * 100).toFixed(0)}%</Typography>
                                                            )}
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        {loading && (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <CircularProgress size={40} color="secondary" />
                                                <Typography variant="body1" sx={{ mt: 2, fontWeight: 'medium' }} color="secondary">
                                                    {statusMessage || 'Searching Supreme Court and High Court judgments... Please wait.'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                )}
</Box>
                        )}

                        {/* Step 4: Strategy (The Viewer) */}
                        {activeStep === 4 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" fontWeight="bold">5. Strategic Memorandum</Typography>
                                    {caseData.strategy && (
                                        <Stack direction="row" spacing={2}>
                                            <Button variant="outlined" startIcon={<ContentCopy />} onClick={() => navigator.clipboard.writeText(caseData.strategy)}>Copy</Button>
                                            <Button variant="contained" startIcon={<Download />} onClick={handleDownloadPDF} color="secondary">PDF Export</Button>
                                        </Stack>
                                    )}
                                </Box>

                                {!caseData.strategy ? (
                                    <Paper sx={{ textAlign: 'center', py: 12, borderRadius: 4, border: '2px dashed', borderColor: 'divider' }}>
                                        <Lightbulb sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} color="primary" />
                                        <Typography variant="h6" gutterBottom>Synthesize Intelligence into Strategy</Typography>
                                        <Button variant="contained" size="large" onClick={handleGenerateStrategy} disabled={loading} startIcon={<Gavel />}>
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Draft Memorandum'}
                                        </Button>
                                    </Paper>
                                ) : (
                                    <Paper 
                                        elevation={6} 
                                        sx={{ 
                                            p: { xs: 4, md: 8 }, 
                                            bgcolor: 'white', 
                                            color: '#1a1a1a', 
                                            fontFamily: '"Georgia", serif',
                                            borderRadius: 2,
                                            maxWidth: '900px',
                                            mx: 'auto',
                                            minHeight: '1000px',
                                            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                            '& h1': { fontSize: '28pt', textAlign: 'center', mb: 4, borderBottom: '3px solid black', pb: 2 },
                                            '& h2': { fontSize: '18pt', fontWeight: 'bold', mb: 2, mt: 4, color: '#2c3e50' },
                                            '& p': { fontSize: '11pt', lineHeight: 1.8, mb: 2, textAlign: 'justify' },
                                            '& strong': { color: '#000' }
                                        }}
                                    >
                                        <ReactMarkdown>{caseData.strategy}</ReactMarkdown>
                                        <Divider sx={{ my: 8 }} />
                                        <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
                                            CERTIFIED BY LEGALYZE AI STRATEGY MODULE
                                        </Typography>
                                    </Paper>
                                )}

</Box>
                        )}

                        {/* Step 5: Drafting */}
                        {activeStep === 5 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h5" fontWeight="bold">6. Legal Document Drafting</Typography>
                                <Button 
                                    variant="contained" 
                                    size="large" 
                                    startIcon={<Description />} 
                                    onClick={handleGenerateDocuments}
                                    disabled={loading}
                                    sx={{ alignSelf: 'center', py: 2, px: 6, borderRadius: 3 }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Petition / Application'}
                                </Button>

                                <Stack spacing={6}>
                                    {caseData.documents.map((doc, i) => (
                                        <Box key={i}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h6" fontWeight="bold" color="primary">{doc.type}</Typography>
                                                <Stack direction="row" spacing={2}>
                                                    <Button 
                                                        variant="outlined" 
                                                        startIcon={<ContentCopy />} 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(doc.content);
                                                            // Could add a toast here
                                                        }}
                                                    >
                                                        Copy Text
                                                    </Button>
                                                    <Button 
                                                        variant="contained" 
                                                        color="secondary"
                                                        startIcon={<PictureAsPdf />} 
                                                        onClick={() => handleExportDocumentPDF(i)}
                                                    >
                                                        Export as PDF
                                                    </Button>
                                                </Stack>
                                            </Box>
                                            
                                            <Paper 
                                                elevation={4} 
                                                sx={{ 
                                                    p: { xs: 4, md: 10 }, 
                                                    bgcolor: 'white', 
                                                    color: '#1a1a1a', 
                                                    fontFamily: '"Times New Roman", Times, serif',
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    maxWidth: '850px',
                                                    mx: 'auto',
                                                    minHeight: '1100px', // Standard A4 ratio
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                                    position: 'relative',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: '4px',
                                                        bgcolor: 'primary.main',
                                                        borderRadius: '4px 4px 0 0'
                                                    },
                                                    '& h1, & h2, & h3': { textAlign: 'center', mb: 3 },
                                                    '& p': { mb: 2, textAlign: 'justify', lineHeight: 2, fontSize: '13pt' },
                                                    '& .legal-content': {
                                                        whiteSpace: 'pre-wrap',
                                                        fontSize: '12pt',
                                                        lineHeight: 1.8
                                                    }
                                                }}
                                            >
                                                <Box className="legal-content">
                                                    <ReactMarkdown>{doc.content}</ReactMarkdown>
                                                </Box>
                                                
                                                <Divider sx={{ my: 6, borderColor: 'rgba(0,0,0,0.1)' }} />
                                                <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
                                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                                        Generated by Legalyze AI - {new Date().toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Box>
                                    ))}
                                </Stack>

</Box>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Box>

            {/* Global Fixed Action Bar */}
            <Box sx={{ 
                mt: 4, 
                pt: 3, 
                borderTop: '1px solid', 
                borderColor: 'divider', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                bgcolor: 'background.default'
            }}>
                <Button 
                    disabled={activeStep === 0 || loading} 
                    onClick={() => setActiveStep(prev => prev - 1)}
                    startIcon={<ArrowBack />}
                >
                    Back
                </Button>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {loading && <CircularProgress size={20} />}
                    <Typography variant="caption" color="text.secondary">
                        Step {activeStep + 1} of {STEPS.length}
                    </Typography>
                </Box>

                <Button 
                    variant="contained"
                    color={activeStep === STEPS.length - 1 ? "success" : "primary"}
                    disabled={loading || 
                        (activeStep === 0 && !caseData.facts.trim()) ||
                        (activeStep === 1 && !caseData.classification) ||
                        (activeStep === 2 && !(searchMetadata.lawsSearched || caseData.relevantLaws.length > 0)) ||
                        (activeStep === 3 && !(searchMetadata.precedentsSearched || caseData.precedents.length > 0)) ||
                        (activeStep === 4 && !caseData.strategy)
                    }
                    onClick={() => {
                        if (activeStep === STEPS.length - 1) {
                            onClose();
                        } else {
                            setActiveStep(prev => prev + 1);
                        }
                    }}
                    endIcon={activeStep === STEPS.length - 1 ? <CheckCircle /> : <ArrowForward />}
                >
                    {activeStep === STEPS.length - 1 ? 'Complete Build' : 'Next Step'}
                </Button>
            </Box>
        </Box>
    );
};

export default CaseBuildingWizard;
