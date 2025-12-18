import React, { useState, useEffect } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepButton,
    StepLabel,
    StepContent,
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
    LinearProgress,
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
    Container
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
    Delete
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const CASE_TYPES = [
    { value: 'criminal', label: 'Criminal', icon: <Gavel /> },
    { value: 'constitutional', label: 'Constitutional', icon: <Balance /> },
    { value: 'civil', label: 'Civil', icon: <Assignment /> },
    { value: 'family', label: 'Family', icon: <School /> }
];

const STEPS = [
    { label: 'Case Intake', description: 'Describe the facts of your case' },
    { label: 'Classification', description: 'Identify case type and issues' },
    { label: 'Relevant Law', description: 'Find applicable Pakistani statutes' },
    { label: 'Precedent Search', description: 'Find Supreme Court judgments' },
    { label: 'Strategy', description: 'Generate case strategy' },
    { label: 'Documents', description: 'Draft necessary petitions' }
];

const API_BASE = 'http://localhost:5000';

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
        // Extracted Facts
        extractedFacts: null,
        // AI Results
        classification: null,
        relevantLaws: [],
        precedents: [],
        strategy: null,
        documents: []
    });

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
                    facts: session.caseDetails.facts,
                    caseType: session.caseDetails.caseType,
                    clientPosition: session.caseDetails.clientPosition,
                    courtLevel: session.caseDetails.courtLevel,
                    urgency: session.caseDetails.urgency,
                    extractedFacts: session.extractedFacts,
                    classification: session.classification,
                    relevantLaws: session.relevantLaws || [],
                    precedents: session.precedents || [],
                    strategy: session.strategy,
                    documents: session.documents || []
                });
                setActiveStep(session.currentStep || session.classification ? 1 : 0);
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
                // On creation only
                ...(method === 'POST' && {
                    facts: currentData.facts,
                    caseType: currentData.caseType,
                    clientPosition: currentData.clientPosition,
                    courtLevel: currentData.courtLevel,
                    urgency: currentData.urgency
                }),
                // On update
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
            // 1. Create Session first
            const newSessionId = await persistSession(caseData, 0);
            const currentSessionId = sessionId || newSessionId;

            // 2. Extract Facts
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

            // 3. Analyze & Classify
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
                
                // Save complete state
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

                setActiveStep(1);
            }
        } catch (err) {
            setError('Failed to analyze case. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 3: Relevant Laws ---
    const handleFindLaws = async () => {
        setLoading(true);
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

            const data = await response.json();
            if (data.success) {
                let laws = [];
                try {
                    laws = JSON.parse(data.data.message);
                } catch {
                    laws = [{ description: data.data.message }];
                }
                
                setCaseData(prev => ({ ...prev, relevantLaws: laws }));
                await persistSession({ ...caseData, relevantLaws: laws }, 3);
                setActiveStep(3);
            }
        } catch (err) {
            setError('Failed to find laws');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 4: Precedents ---
    const handleFindPrecedents = async () => {
        setLoading(true);
        try {
            // Search local judgment DB
            const searchResponse = await fetch(`${API_BASE}/api/judgments/search?query=${encodeURIComponent(caseData.facts)}&caseType=${caseData.caseType}&limit=5`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const searchData = await searchResponse.json();
            
            // AI Analysis
            const aiResponse = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: `Find relevant Supreme Court of Pakistan precedents.
                    
FACTS: ${caseData.facts}

Return JSON array: [{"citation": "...", "caseName": "...", "ratio": "...", "application": "..."}]`
                })
            });
            const aiData = await aiResponse.json();

            let precedents = searchData.data || [];
            if (aiData.success) {
                try {
                    const aiPrecedents = JSON.parse(aiData.data.message);
                    precedents = [...precedents, ...aiPrecedents];
                } catch (e) { console.error(e); }
            }

            setCaseData(prev => ({ ...prev, precedents }));
            await persistSession({ ...caseData, precedents }, 4);
            setActiveStep(4);
        } catch (err) {
            setError('Failed to find precedents');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 5: Strategy ---
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
                setActiveStep(5);
            }
        } catch (err) {
            setError('Failed to generate strategy');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 6: Documents ---
    const handleGenerateDocuments = async () => {
        setLoading(true);
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
                    message: `Draft a ${docType} for Pakistani courts based on this case.
                    
                    Facts: ${caseData.facts}
                    Client: ${caseData.clientPosition}
                    Court: ${caseData.courtLevel}
                    
                    Include all standard sections:
                    - Title
                    - Parties
                    - Facts
                    - Grounds
                    - Prayer
                    - Verification
                    
                    Use proper Pakistani legal format and terminology.`
                })
            });

            const data = await response.json();
            if (data.success) {
                const newDoc = { type: docType, content: data.data.message };
                setCaseData(prev => ({
                    ...prev,
                    documents: [...prev.documents, newDoc]
                }));
                // Update session
                await persistSession({ ...caseData, documents: [...caseData.documents, newDoc] }, 5);
            }
        } catch (err) {
            setError('Failed to generate documents');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Step-by-step Pakistani legal guidance and strategy generation
                </Typography>
                <Button 
                    startIcon={<History />} 
                    variant="outlined" 
                    onClick={fetchSessions}
                    size="small"
                >
                    History
                </Button>
            </Box>

            {/* Error Banner */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* History Dialog */}
            <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
                <DialogTitle>Previous Cases</DialogTitle>
                <DialogContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Title / Facts</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session._id} hover sx={{ cursor: 'pointer' }} onClick={() => loadSession(session._id)}>
                                    <TableCell>{new Date(session.updatedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{session.title || session.caseDetails.facts.substring(0, 50) + '...'}</TableCell>
                                    <TableCell><Chip label={session.caseDetails.caseType} size="small" /></TableCell>
                                    <TableCell>{session.status}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={(e) => deleteSession(e, session._id)}>
                                            <Delete fontSize="small" />
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

            {/* Main Stepper */}
            <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
                
                {/* Step 1: Intake */}
                <Step>
                    <StepButton onClick={() => setActiveStep(0)}>
                        <Typography variant="h6">{STEPS[0].label}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{STEPS[0].description}</Typography>
                    </StepButton>
                    <StepContent>
                        <Box sx={{ mt: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                label="Case Facts"
                                placeholder="Describe specifically what happened, names of parties, dates, locations, and the current legal situation..."
                                value={caseData.facts}
                                onChange={(e) => setCaseData(p => ({ ...p, facts: e.target.value }))}
                                variant="outlined"
                            />

                            <Stack direction="row" spacing={3}>
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
                            </Stack>

                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleAnalysis}
                                disabled={loading || !caseData.facts.trim()}
                                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                                sx={{ alignSelf: 'flex-start', px: 4, py: 1.5 }}
                            >
                                {loading ? 'Analyzing Case...' : 'Analyze & Classify'}
                            </Button>
                        </Box>
                    </StepContent>
                </Step>

                {/* Step 2: Classification Results */}
                <Step>
                    <StepButton onClick={() => setActiveStep(1)}>
                        <Typography variant="h6">{STEPS[1].label}</Typography>
                    </StepButton>
                    <StepContent>
                        <Box sx={{ mt: 2, mb: 3 }}>
                            {caseData.classification && (
                                <Card variant="outlined" sx={{ bgcolor: 'background.paper', mb: 3, borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Chip icon={<Gavel />} label={caseData.classification.caseType} color="primary" />
                                                <Chip icon={<Assignment />} label={caseData.classification.urgencyLevel} color={caseData.classification.urgencyLevel === 'high' ? 'error' : 'default'} />
                                            </Box>
                                            
                                            <Divider />
                                            
                                            <Typography variant="subtitle1" fontWeight="bold">Key Legal Issues:</Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {caseData.classification.legalIssues?.map((issue, i) => (
                                                    <Chip key={i} label={issue} variant="outlined" />
                                                ))}
                                            </Box>

                                            {caseData.extractedFacts && (
                                                <>
                                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Extracted Key Facts:</Typography>
                                                    <List dense>
                                                        {caseData.extractedFacts.keyFacts?.map((fact, i) => (
                                                            <ListItem key={i} disablePadding>
                                                                <ListItemIcon sx={{ minWidth: 30 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                                                <ListItemText primary={fact} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </>
                                            )}

                                            <Alert severity="info" icon={<Lightbulb />}>
                                                {caseData.classification.initialAdvice}
                                            </Alert>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}
                            
                            <Stack direction="row" spacing={2}>
                                <Button onClick={() => setActiveStep(0)} startIcon={<ArrowBack />}>Back</Button>
                                <Button variant="contained" onClick={() => setActiveStep(2)} endIcon={<ArrowForward />}>Continue</Button>
                            </Stack>
                        </Box>
                    </StepContent>
                </Step>

                {/* Step 3: Laws */}
                <Step>
                    <StepButton onClick={() => setActiveStep(2)}>
                        <Typography variant="h6">{STEPS[2].label}</Typography>
                    </StepButton>
                    <StepContent>
                        <Box sx={{ mt: 2, mb: 3 }}>
                            <Button 
                                variant="contained" 
                                onClick={handleFindLaws}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                                sx={{ mb: 3 }}
                            >
                                Find Applicable Laws
                            </Button>

                            <Stack spacing={2}>
                                {caseData.relevantLaws.map((law, i) => (
                                    <Paper key={i} sx={{ p: 2, borderLeft: '4px solid #1976d2' }}>
                                        <Typography variant="subtitle1" fontWeight="bold" color="primary">{law.section || law.law}</Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>{law.relevance || law.description}</Typography>
                                    </Paper>
                                ))}
                            </Stack>

                            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                <Button onClick={() => setActiveStep(1)} startIcon={<ArrowBack />}>Back</Button>
                                <Button variant="contained" onClick={() => setActiveStep(3)} endIcon={<ArrowForward />}>Continue</Button>
                            </Stack>
                        </Box>
                    </StepContent>
                </Step>

                {/* Step 4: Precedents */}
                <Step>
                    <StepButton onClick={() => setActiveStep(3)}>
                        <Typography variant="h6">{STEPS[3].label}</Typography>
                    </StepButton>
                    <StepContent>
                        <Box sx={{ mt: 2, mb: 3 }}>
                            <Button 
                                variant="contained" 
                                onClick={handleFindPrecedents}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                                sx={{ mb: 3 }}
                            >
                                Search Precedents
                            </Button>

                            <Stack spacing={2}>
                                {caseData.precedents.map((p, i) => (
                                    <Accordion key={i} variant="outlined">
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography fontWeight="bold">{p.citation || p.caseTitle || `Case ${i+1}`}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography variant="body2" paragraph><strong>Ratio:</strong> {p.ratio}</Typography>
                                            <Typography variant="body2"><strong>Application:</strong> {p.application}</Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Stack>

                            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                <Button onClick={() => setActiveStep(2)} startIcon={<ArrowBack />}>Back</Button>
                                <Button variant="contained" onClick={() => setActiveStep(4)} endIcon={<ArrowForward />}>Continue</Button>
                            </Stack>
                        </Box>
                    </StepContent>
                </Step>

                {/* Step 5: Strategy */}
                <Step>
                    <StepButton onClick={() => setActiveStep(4)}>
                        <Typography variant="h6">{STEPS[4].label}</Typography>
                    </StepButton>
                    <StepContent>
                        <Box sx={{ mt: 2, mb: 3 }}>
                            <Button 
                                variant="contained" 
                                onClick={handleGenerateStrategy}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <Lightbulb />}
                                sx={{ mb: 3 }}
                            >
                                Generate Strategy
                            </Button>

                            {caseData.strategy && (
                                <Paper sx={{ p: 4, bgcolor: 'background.default' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                        <Button startIcon={<ContentCopy />} size="small" onClick={() => navigator.clipboard.writeText(caseData.strategy)}>Copy Strategy</Button>
                                    </Box>
                                    <div className="markdown-body">
                                        <ReactMarkdown>{caseData.strategy}</ReactMarkdown>
                                    </div>
                                </Paper>
                            )}

                             <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                <Button onClick={() => setActiveStep(3)} startIcon={<ArrowBack />}>Back</Button>
                                <Button variant="contained" onClick={() => setActiveStep(5)} endIcon={<ArrowForward />}>Continue</Button>
                            </Stack>
                        </Box>
                    </StepContent>
                </Step>

                {/* Step 6: Documents */}
                <Step>
                    <StepButton onClick={() => setActiveStep(5)}>
                        <Typography variant="h6">{STEPS[5].label}</Typography>
                    </StepButton>
                    <StepContent>
                         <Box sx={{ mt: 2, mb: 3 }}>
                            <Button 
                                variant="contained" 
                                onClick={handleGenerateDocuments}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <Description />}
                                sx={{ mb: 3 }}
                            >
                                Draft Documents
                            </Button>

                            {caseData.documents.map((doc, i) => (
                                <Paper key={i} sx={{ p: 4, mb: 3, bgcolor: 'background.default' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">{doc.type}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button size="small" startIcon={<ContentCopy />} onClick={() => navigator.clipboard.writeText(doc.content)}>Copy</Button>
                                            <Button size="small" startIcon={<Download />} onClick={() => {
                                                const blob = new Blob([doc.content], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `${doc.type.replace(/\s+/g, '_')}.txt`;
                                                a.click();
                                            }}>Download</Button>
                                        </Box>
                                    </Box>
                                    <div className="markdown-body">
                                        <ReactMarkdown>{doc.content}</ReactMarkdown>
                                    </div>
                                </Paper>
                            ))}

                            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                <Button onClick={() => setActiveStep(4)} startIcon={<ArrowBack />}>Back</Button>
                                <Button variant="contained" color="success" onClick={onClose} startIcon={<CheckCircle />}>Finish Case</Button>
                            </Stack>
                        </Box>
                    </StepContent>
                </Step>
            </Stepper>
        </Box>
    );
};

export default CaseBuildingWizard;
