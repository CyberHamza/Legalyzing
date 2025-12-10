import React, { useState, useEffect, useRef } from 'react';
import { formatComplianceReport } from '../utils/complianceReportFormatter';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Button,
    TextField,
    IconButton,
    Paper,
    Avatar,
    CircularProgress,
    Chip,
    Divider,
    Menu,
    MenuItem,
    Snackbar,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    ListItemIcon,
    Tooltip
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import {
    Add,
    Search,
    MoreVert,
    Logout,
    Brightness4,
    Brightness7,
    AttachFile,
    Send,
    Description,
    Home,
    Work,
    Handshake,
    BusinessCenter,
    Block,
    Lock,
    Store,
    ShoppingCart,
    Person,
    Delete,
    OpenInNew,
    ChevronLeft,
    ChevronRight,
    Edit,
    Menu as MenuIcon,
    Download,
    CalendarToday,
    Visibility,
    Gavel
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useColorMode } from '../App';
import { chatAPI, documentAPI, authAPI, generateAPI, smartGenerateAPI } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';

// ... (rest of imports)

// ... (inside component)

                                                    {/* Generate Now Button - Direct generation */}
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<Description />}
                                                        onClick={async () => {
                                                            try {
                                                                setIsTyping(true);
                                                                // smartGenerateAPI is now imported at top level
                                                                
                                                                const response = await smartGenerateAPI.generate(
                                                                    message.generationData.documentType,
                                                                    message.generationData.mappedFields,
                                                                    true // Allow missing fields
                                                                );
                                                                
                                                                if (response.success) {
                                                                    // Show success message in chat
                                                                    setMessages(prev => [...prev, {
                                                                        role: 'assistant',
                                                                        content: `✅ **Document generated successfully!**\n\nYour ${message.generationData.documentTypeName} has been created and saved.\n\nYou can download it from the "Generated Documents" section in the sidebar.`
                                                                    }]);
                                                                    
                                                                    // Refresh generated documents list
                                                                    fetchGeneratedDocuments();
                                                                    
                                                                    setNotification({
                                                                        open: true,
                                                                        message: 'Document generated successfully!',
                                                                        severity: 'success'
                                                                    });
                                                                }
                                                            } catch (error) {
                                                                console.error('Generation error:', error);
                                                                setMessages(prev => [...prev, {
                                                                    role: 'assistant',
                                                                    content: `❌ Sorry, I encountered an error generating the document: ${error.message || 'Unknown error'}\n\nPlease try again or use the "Review & Edit" option to check your information.`
                                                                }]);
                                                            } finally {
                                                                setIsTyping(false);
                                                            }
                                                        }}
                                                        sx={{
                                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                            color: 'white',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                                            '&:hover': {
                                                                background: 'linear-gradient(135deg, #4f46e5 0%, #047857 100%)',
                                                                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                                                            }
                                                        }}
                                                    >
                                                        🚀 Generate Now
                                                    </Button>
                                                    
                                                    {/* Review & Edit Button - Navigate to form */}
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<Edit />}
                                                        onClick={() => {
                                                            // Navigate to standard DocumentForm with pre-filled data
                                                            navigate(`/document/${message.generationData.documentType}`, {
                                                                state: { generationData: message.generationData }
                                                            });
                                                        }}
                                                        sx={{
                                                            borderColor: 'primary.main',
                                                            color: 'primary.main',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            '&:hover': {
                                                                borderColor: 'primary.dark',
                                                                bgcolor: 'rgba(99, 102, 241, 0.05)',
                                                            }
                                                        }}
                                                    >
                                                        📝 Review & Edit Fields
                                                    </Button>
import { documentTemplates } from '../utils/mockData';

const SIDEBAR_WIDTH = 280;
const DOC_SIDEBAR_WIDTH = 280;

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DocumentMessageBubble = ({ document, role, theme, mode }) => {
    const isUser = role === 'user';
    
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                bgcolor: isUser ? 'primary.main' : (mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white'),
                color: isUser ? 'white' : 'text.primary',
                borderRadius: '2px',
                borderTopRightRadius: isUser ? 0 : '2px',
                borderTopLeftRadius: isUser ? '2px' : 0,
                width: '100%',
                minWidth: 250,
                maxWidth: 400
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar
                    variant="rounded"
                    sx={{
                        bgcolor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                        color: isUser ? 'white' : 'primary.main',
                        width: 48,
                        height: 48,
                        borderRadius: '2px'
                    }}
                >
                    <Description fontSize="medium" />
                </Avatar>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 0.5 }}>
                        {document.filename || document.fileName || 'Document'}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 1.5 }}>
                        {document.fileSize ? (document.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown size'} • {new Date(document.createdAt || document.uploadDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant={isUser ? "outlined" : "contained"}
                            startIcon={<Visibility fontSize="small" />}
                            onClick={() => window.open(document.url || document.s3Url, '_blank')}
                            sx={{
                                borderColor: isUser ? 'rgba(255,255,255,0.5)' : 'primary.main',
                                color: isUser ? 'white' : 'white',
                                bgcolor: isUser ? 'transparent' : 'primary.main',
                                '&:hover': {
                                    borderColor: 'white',
                                    bgcolor: isUser ? 'rgba(255,255,255,0.1)' : 'primary.dark'
                                },
                                textTransform: 'none',
                                borderRadius: '2px',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto'
                            }}
                        >
                            View
                        </Button>
                        <Button
                            size="small"
                            variant={isUser ? "outlined" : "outlined"}
                            startIcon={<Download fontSize="small" />}
                            component="a"
                            href={document.url || document.s3Url}
                            download
                            sx={{
                                borderColor: isUser ? 'rgba(255,255,255,0.5)' : 'primary.main',
                                color: isUser ? 'white' : 'primary.main',
                                '&:hover': {
                                    borderColor: 'white',
                                    bgcolor: isUser ? 'rgba(255,255,255,0.1)' : 'rgba(99, 102, 241, 0.05)'
                                },
                                textTransform: 'none',
                                borderRadius: '2px',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto'
                            }}
                        >
                            Download
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

const ChatInterface = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { mode, toggleColorMode } = useColorMode();

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [generatedDocs, setGeneratedDocs] = useState([]);
    const [isComplianceChecking, setIsComplianceChecking] = useState(false);
    const [inactivityTimer, setInactivityTimer] = useState(null);
    const INACTIVITY_TIMEOUT = 600000; // 10 minutes in milliseconds


    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [menuChatId, setMenuChatId] = useState(null);
    const [menuChatDate, setMenuChatDate] = useState(null);
    
    const [docMenuAnchorEl, setDocMenuAnchorEl] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    
    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { type: 'chat' | 'document', data: ... }
    
    // Notification State
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [isDownloading, setIsDownloading] = useState(false);

    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchConversations();
        fetchDocuments();
        fetchGeneratedDocuments();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-logout security feature
    const handleAutoLogout = () => {
        console.log('Auto-logout triggered due to inactivity');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const resetInactivityTimer = () => {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        const timer = setTimeout(handleAutoLogout, INACTIVITY_TIMEOUT);
        setInactivityTimer(timer);
    };

    // Setup inactivity listeners
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });
        
        resetInactivityTimer();
        
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }
        };
    }, []);


    const handleMenuOpen = (event, chatId, chatDate) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setMenuChatId(chatId);
        setMenuChatDate(chatDate);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuChatId(null);
        setMenuChatDate(null);
    };

    const handleMenuDelete = (e) => {
        handleDeleteChat(e, menuChatId);
        handleMenuClose();
    };

    const fetchConversations = async () => {
        try {
            const response = await chatAPI.getConversations();
            if (response.success) {
                setChats(response.data);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await documentAPI.list();
            if (response.success) {
                setUploadedDocs(response.data);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
        }
    };

    const fetchGeneratedDocuments = async () => {
        try {
            const response = await generateAPI.getDocuments();
            if (response.success) {
                setGeneratedDocs(response.documents);
            }
        } catch (err) {
            console.error('Error fetching generated documents:', err);
        }
    };

    const handleDocMenuOpen = (event, doc) => {
        event.stopPropagation();
        setDocMenuAnchorEl(event.currentTarget);
        setSelectedDoc(doc);
    };

    const handleDocMenuClose = () => {
        setDocMenuAnchorEl(null);
        setSelectedDoc(null);
    };

    const handleDeleteClick = (type, data) => {
        setItemToDelete({ type, data });
        setDeleteDialogOpen(true);
        if (type === 'document') {
            handleDocMenuClose();
        }
        if (type === 'chat') {
            setMenuAnchorEl(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'document') {
                const doc = itemToDelete.data;
                const docId = doc.id || doc._id;
                
                console.log('Deleting document:', docId, doc);
                
                if (doc.fileName) {
                    await generateAPI.deleteDocument(docId);
                } else {
                    await documentAPI.delete(docId);
                }
                fetchDocuments();
                fetchGeneratedDocuments();
            } else if (itemToDelete.type === 'chat') {
                const chat = itemToDelete.data;
                const chatId = chat.id || chat._id;
                await chatAPI.deleteConversation(chatId); // Fixed API call
                
                if (activeChat && (activeChat.id === chatId || activeChat._id === chatId)) {
                    setActiveChat(null);
                    setMessages([]);
                }
                fetchConversations();
            }
        } catch (err) {
            console.error('Error deleting item:', err);
            setError(`Failed to delete ${itemToDelete.type}: ${err.message || 'Unknown error'}`);
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() && attachedFiles.length === 0) return;

        console.log('=== SENDING MESSAGE ===');
        console.log('Attached files:', attachedFiles);
        console.log('Attached files length:', attachedFiles.length);
        console.log('First file:', attachedFiles[0]);

        const filesArray = attachedFiles.length > 0 ? attachedFiles.map(f => ({
            id: f.id,
            filename: f.filename,
            processed: f.processed
        })) : [];

        console.log('Files array:', filesArray);

        const newMessage = {
            role: 'user',
            content: inputMessage,
            files: filesArray.length > 0 ? filesArray : undefined
        };

        console.log('New message object:', JSON.stringify(newMessage, null, 2));

        setMessages(prev => {
            const updated = [...prev, newMessage];
            console.log('Updated messages:', updated);
            return updated;
        });
        setInputMessage('');
        
        // BUGFIX: Clear attached files immediately after adding to message
        setAttachedFiles([]);
        
        setIsTyping(true);

        try {
            // Collect all relevant document IDs
            // 1. Currently attached files
            const attachedIds = attachedFiles.map(f => f.id || f._id).filter(Boolean);
            
            // 2. Existing chat documents
            const existingIds = activeChat?.documentIds || [];

            // 3. All uploaded documents (Sidebar)
            // This ensures the AI can see everything the user has uploaded
            const uploadedIds = uploadedDocs.map(d => d.id || d._id).filter(Boolean);

            // 4. Generated documents (if any relevant)
            const generatedIds = generatedDocs.map(d => d.id || d._id).filter(Boolean);
            
            // Merge and unique IDs - Prioritize attached > active > uploaded
            const documentIds = [...new Set([...attachedIds, ...existingIds, ...uploadedIds, ...generatedIds])];

            console.log('Sending message with FULL document context:', documentIds);

            const response = await chatAPI.sendMessage(
                newMessage.content,
                activeChat?.id || activeChat?._id,
                documentIds
            );

            if (response.success) {
                const aiMessage = {
                    role: 'assistant',
                    content: response.data.message,
                    // Store generation data if present
                    generationData: response.data.generation || null
                };
                setMessages(prev => [...prev, aiMessage]);

                if (response.data.conversation) {
                    setActiveChat({
                        _id: response.data.conversation.id,
                        id: response.data.conversation.id,
                        title: response.data.conversation.title,
                        messages: response.data.conversation.messages,
                        updatedAt: new Date(),
                        // Store latest generation data in active chat for easy access
                        latestGenerationData: response.data.generation || null
                    });
                }

                // Clear attached files after sending
                setAttachedFiles([]);
                fetchConversations();
            }
        } catch (err) {
            console.error('Error sending message:', err);
            if (err.response) {
                console.error('Error response:', err.response.data);
                console.error('Error status:', err.response.status);
            }
            setError(`Failed to send message: ${err.response?.data?.message || err.message || 'Unknown error'}`);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Sorry, I encountered an error: ${err.response?.data?.message || err.message || 'Unknown error'}`
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const pollDocumentStatus = async (documentId, maxAttempts = 15) => {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            try {
                const response = await documentAPI.get(documentId);
                if (response.success && response.data.processed) {
                    return { success: true, processed: true };
                }
            } catch (error) {
                console.error('Error polling document status:', error);
            }
        }
        return { success: false, processed: false }; // Timeout
    };

    const handleFileAttach = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setLoading(true);
        try {
            const uploaded = [];
            for (const file of files) {
                // Pass activeChat.id to link document to this chat
                const response = await documentAPI.upload(file, activeChat?.id || activeChat?._id);
                if (response.success) {
                    const docData = { ...response.data, processing: true };
                    uploaded.push(docData);
                    
                    // NEW: Add document message to chat

                    setMessages(prev => [...prev, {
                        role: 'user',
                        type: 'document',
                        content: `Uploaded ${response.data.filename}`,
                        document: response.data,
                        timestamp: new Date()
                    }]);
                    
                    // Start polling for this document
                    pollDocumentStatus(response.data.id).then(result => {
                        setAttachedFiles(prev => prev.map(f => 
                            f.id === response.data.id 
                                ? { ...f, processed: result.processed, processing: false }
                                : f
                        ));
                    });
                }
            }
            setAttachedFiles(prev => [...prev, ...uploaded]);
            fetchDocuments();
        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Failed to upload file.');
        } finally {
            setLoading(false);
        }
    };

    const removeFile = (index) => {
        setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
    };

    const handleNewChat = () => {
        setActiveChat(null);
        setMessages([]);
    };

    const handleChatSelect = async (chat) => {
        const chatId = chat?.id || chat?._id;
        if (!chat || !chatId) return;

        setActiveChat(chat);
        if (chat.messages) {
            setMessages(chat.messages);
        } else {
            try {
                const response = await chatAPI.getConversation(chatId);
                if (response.success) {
                    setMessages(response.data.messages);
                }
            } catch (err) {
                console.error('Error fetching chat details:', err);
            }
        }
    };

    const handleDeleteChat = async (e, chatId) => {
        if (e) e.stopPropagation();
        if (menuChatId) {
            const chatToDelete = chats.find(c => (c.id === menuChatId || c._id === menuChatId));
            handleDeleteClick('chat', chatToDelete);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/signin');
        } catch (err) {
            console.error('Logout error:', err);
            navigate('/signin');
        }
    };

    const handleDocumentTemplate = (template) => {
        navigate(`/document/${template.id}`);
    };

    const handleDownloadDocument = (doc) => {
        const url = doc.signedUrl || doc.s3Url;
        if (url) {
            window.open(url, '_blank');
        } else {
            alert(`Downloading ${doc.filename || doc.name}...`);
        }
    };

    const getDocumentIcon = (iconName) => {
        const icons = {
            DescriptionIcon: <Description />,
            HomeIcon: <Home />,
            WorkIcon: <Work />,
            HandshakeIcon: <Handshake />,
            BusinessCenterIcon: <BusinessCenter />,
            BlockIcon: <Block />,
            LockIcon: <Lock />,
            StoreIcon: <Store />,
            ShoppingCartIcon: <ShoppingCart />,
            PersonIcon: <Person />,
        };
        return icons[iconName] || <Description />;
    };

    const filteredChats = chats.filter(chat =>
        chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', background: theme.palette.background.default, overflow: 'hidden' }}>
            {/* Left Sidebar - Chat History */}
            <Drawer
                variant="persistent"
                anchor="left"
                open={leftOpen}
                sx={{
                    width: SIDEBAR_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        background: mode === 'dark' ? '#000000' : '#f8fafc',
                        borderRight: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        display: 'flex',
                        flexDirection: 'column'
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            cursor: 'pointer',
                            fontSize: '1.1rem'
                        }}
                        onClick={() => navigate('/')}
                    >
                        Legalyzing
                    </Typography>
                </Box>

                <Box sx={{ px: 2, mb: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleNewChat}
                        sx={{
                            mb: 2,
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
                            }
                        }}
                    >
                        New Chat
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Gavel />}
                        component="label"
                        sx={{
                            mb: 2,
                            textTransform: 'none',
                            borderRadius: '2px',
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            fontSize: '0.85rem',
                            '&:hover': {
                                borderColor: 'primary.dark',
                                bgcolor: mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(79, 70, 229, 0.04)'
                            }
                        }}
                    >
                        Compliance Checkup
                        <input
                            type="file"
                            hidden
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                // Reset input so selecting the same file again works
                                e.target.value = '';

                                setIsComplianceChecking(true);
                                
                                try {
                                    const response = await documentAPI.constitutionalComplianceCheck(file);

                                    if (response.success && response.data.conversationId) {
                                        // Fetch the created conversation
                                        const conversationResponse = await chatAPI.getConversation(response.data.conversationId);
                                        
                                        if (conversationResponse.success) {
                                            const conv = conversationResponse.data;
                                            
                                            // Generate formatted report
                                            const reportContent = formatComplianceReport(response.data, file.name);
                                            
                                            // Add report as a new message to the conversation
                                            const updatedMessages = [
                                                ...conv.messages,
                                                {
                                                    role: 'assistant',
                                                    content: reportContent
                                                }
                                            ];
                                            
                                            // Set current conversation
                                            setActiveChat(conv);
                                            setMessages(updatedMessages);
                                            
                                            // Refresh conversations list
                                            fetchConversations();
                                            
                                            // Show success message
                                            console.log('✅ Compliance report loaded in conversation:', conv.id);
                                        }
                                    } else {
                                        setMessages(prev => [...prev, {
                                            role: 'assistant',
                                            content: `❌ Compliance check failed: ${response.message || 'Unknown error'}`
                                        }]);
                                    }
                                } catch (err) {
                                    console.error('Compliance check error:', err);
                                    setMessages(prev => [...prev, {
                                        role: 'assistant',
                                        content: `❌ Failed to run compliance check: ${err.message || 'Unknown error'}`
                                    }]);
                                } finally {
                                    setIsComplianceChecking(false);
                                }
                            }}
                        />
                    </Button>
                    <TextField
                        fullWidth
                        placeholder="Search chats..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <Search fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
                            sx: { 
                                fontSize: '0.9rem',
                                bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                '& fieldset': { 
                                    border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` 
                                },
                                '&:hover fieldset': {
                                    borderColor: 'primary.main'
                                },
                                borderRadius: '2px'
                            }
                        }}
                    />
                </Box>

                <List sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
                    {filteredChats.map((chat, index) => (
                        <ListItem
                            key={chat._id || chat.id || `chat-${index}`}
                            disablePadding
                            sx={{ mb: 0.5 }}
                            secondaryAction={
                                <IconButton 
                                    edge="end" 
                                    size="small"
                                    onClick={(e) => handleMenuOpen(e, chat.id || chat._id, chat.updatedAt)}
                                    sx={{ opacity: 0, transition: 'opacity 0.2s', '.MuiListItem-root:hover &': { opacity: 1 } }}
                                >
                                    <MoreVert fontSize="small" />
                                </IconButton>
                            }
                        >
                            <ListItemButton
                                selected={(activeChat?.id || activeChat?._id) === (chat.id || chat._id)}
                                onClick={() => handleChatSelect(chat)}
                                sx={{
                                    borderRadius: '2px',
                                    '&.Mui-selected': {
                                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                                        borderLeft: '3px solid #6366f1',
                                        '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.15)' }
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={chat.title || 'New Chat'}
                                    secondary={new Date(chat.updatedAt).toLocaleDateString()}
                                    primaryTypographyProps={{ fontSize: '0.9rem', noWrap: true }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ p: 2, borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                    <Button
                        fullWidth
                        startIcon={<Logout />}
                        onClick={handleLogout}
                        sx={{ 
                            justifyContent: 'flex-start', 
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                        }}
                    >
                        Sign Out
                    </Button>
                </Box>
            </Drawer>

            {/* Main Chat Area */}
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100%',
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    ...(leftOpen && {
                        marginLeft: 0,
                        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
                        transition: theme.transitions.create(['margin', 'width'], {
                            easing: theme.transitions.easing.easeOut,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    }),
                    ...(!leftOpen && {
                        marginLeft: `-${SIDEBAR_WIDTH}px`,
                        width: '100%',
                    }),
                    ...(rightOpen && {
                        marginRight: 0,
                        width: `calc(100% - ${leftOpen ? SIDEBAR_WIDTH + DOC_SIDEBAR_WIDTH : DOC_SIDEBAR_WIDTH}px)`,
                    }),
                    ...(!rightOpen && {
                        marginRight: `-${DOC_SIDEBAR_WIDTH}px`,
                        width: leftOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%',
                    }),
                }}
            >
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        background: theme.palette.background.default
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => setLeftOpen(!leftOpen)}>
                            {leftOpen ? <ChevronLeft /> : <MenuIcon />}
                        </IconButton>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {activeChat?.title || 'New Conversation'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={toggleColorMode}>
                            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                        </IconButton>
                        <IconButton onClick={() => setRightOpen(!rightOpen)}>
                            {rightOpen ? <ChevronRight /> : <ChevronLeft />}
                        </IconButton>
                    </Box>
                </Paper>

                {/* Messages Area */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages.map((message, index) => (
                        <Box
                            key={message.id || `msg-${index}`}
                            sx={{
                                display: 'flex',
                                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                mb: 2
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: '75%',
                                    display: 'flex',
                                    gap: 1,
                                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                                }}
                            >
                                <Avatar
                                    sx={{
                                        bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                                        width: 32,
                                        height: 32,
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {message.role === 'user' ? 'U' : 'AI'}
                                </Avatar>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {message.type === 'document' ? (
                                        <DocumentMessageBubble 
                                            document={message.document} 
                                            role={message.role} 
                                            theme={theme} 
                                            mode={mode} 
                                        />
                                    ) : (
                                        <>
                                            {/* File Bubble for Uploaded Documents */}
                                            {message.metadata?.fileName && (
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        mb: 1,
                                                        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        maxWidth: '400px'
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '6px',
                                                            bgcolor: 'primary.main',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <Description sx={{ color: 'white', fontSize: 20 }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {message.metadata.fileName}
                                                        </Typography>
                                                        {message.metadata.fileSize && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: 'text.secondary',
                                                                    fontSize: '0.75rem'
                                                                }}
                                                            >
                                                                {(message.metadata.fileSize / 1024).toFixed(1)} KB
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Paper>
                                            )}
                                            
                                            {/* Message Content */}
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    bgcolor: message.role === 'user' ? 'primary.main' : (mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white'),
                                                    color: message.role === 'user' ? 'white' : 'text.primary',
                                                    borderRadius: '2px',
                                                    borderTopRightRadius: message.role === 'user' ? 0 : '2px',
                                                    borderTopLeftRadius: message.role === 'user' ? '2px' : 0
                                                }}
                                            >
                                                <Box sx={{ '& p': { margin: 0 }, '& p + p': { marginTop: 1 } }}>
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({node, ...props}) => <Typography variant="body2" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }} {...props} />,
                                                            strong: ({node, ...props}) => <strong style={{ fontWeight: 700 }} {...props} />,
                                                            em: ({node, ...props}) => <em {...props} />,
                                                            ul: ({node, ...props}) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                                                            ol: ({node, ...props}) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                                                            li: ({node, ...props}) => <li style={{ marginBottom: '4px' }} {...props} />,
                                                            h2: ({node, ...props}) => <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, mb: 1 }} {...props} />,
                                                            h3: ({node, ...props}) => <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1.5, mb: 0.5 }} {...props} />,
                                                            hr: ({node, ...props}) => <Divider sx={{ my: 1.5 }} {...props} />,
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </Box>
                                            </Paper>
                                        
                                        {/* Show Generate Document buttons if AI detected generation intent */}
                                        {message.role === 'assistant' && message.generationData && message.generationData.hasGenerationIntent && (
                                            <Box sx={{ mt: 2 }}>
                                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                    {/* Generate Now Button - Direct generation */}
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<Description />}
                                                        onClick={async () => {
                                                            try {
                                                                setIsTyping(true);
                                                                const { smartGenerateAPI } = await import('../utils/api');
                                                                
                                                                const response = await smartGenerateAPI.generate(
                                                                    message.generationData.documentType,
                                                                    message.generationData.mappedFields,
                                                                    true // Allow missing fields
                                                                );
                                                                
                                                                if (response.success) {
                                                                    // Show success message in chat
                                                                    setMessages(prev => [...prev, {
                                                                        role: 'assistant',
                                                                        content: `✅ **Document generated successfully!**\n\nYour ${message.generationData.documentTypeName} has been created and saved.\n\nYou can download it from the "Generated Documents" section in the sidebar.`
                                                                    }]);
                                                                    
                                                                    // Refresh generated documents list
                                                                    fetchGeneratedDocuments();
                                                                    
                                                                    setNotification({
                                                                        open: true,
                                                                        message: 'Document generated successfully!',
                                                                        severity: 'success'
                                                                    });
                                                                }
                                                            } catch (error) {
                                                                console.error('Generation error:', error);
                                                                setMessages(prev => [...prev, {
                                                                    role: 'assistant',
                                                                    content: `❌ Sorry, I encountered an error generating the document: ${error.message || 'Unknown error'}\n\nPlease try again or use the "Review & Edit" option to check your information.`
                                                                }]);
                                                            } finally {
                                                                setIsTyping(false);
                                                            }
                                                        }}
                                                        sx={{
                                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                            color: 'white',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                                            '&:hover': {
                                                                background: 'linear-gradient(135deg, #4f46e5 0%, #047857 100%)',
                                                                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                                                            }
                                                        }}
                                                    >
                                                        🚀 Generate Now
                                                    </Button>
                                                    
                                                    {/* Review & Edit Button - Navigate to form */}
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<Edit />}
                                                        onClick={() => {
                                                            navigate(`/document/${message.generationData.documentType}`, {
                                                                state: { generationData: message.generationData }
                                                            });
                                                        }}
                                                        sx={{
                                                            borderColor: 'primary.main',
                                                            color: 'primary.main',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            '&:hover': {
                                                                borderColor: 'primary.dark',
                                                                bgcolor: 'rgba(99, 102, 241, 0.05)',
                                                            }
                                                        }}
                                                    >
                                                        📝 Review & Edit Fields
                                                    </Button>
                                                </Box>
                                                
                                                <Typography variant="caption" display="block" sx={{ mt: 1.5, color: 'text.secondary' }}>
                                                    {message.generationData.completeness.completionPercentage}% complete • 
                                                    {message.generationData.completeness.availableFields.length} fields filled • 
                                                    {message.generationData.completeness.missingFields.length} fields missing
                                                </Typography>
                                            </Box>
                                        )}

                                        </>
                                    )}
                                    {message.files && message.files.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {message.files.map((file, fileIndex) => (
                                                <Chip
                                                    key={fileIndex}
                                                    icon={<Description fontSize="small" />}
                                                    label={file.filename || file.name || 'Document'}
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        borderRadius: '2px',
                                                        fontSize: '0.7rem',
                                                        bgcolor: message.role === 'user' 
                                                            ? 'rgba(255, 255, 255, 0.2)' 
                                                            : 'rgba(99, 102, 241, 0.1)',
                                                        color: message.role === 'user' ? 'white' : 'text.primary',
                                                        '& .MuiChip-icon': {
                                                            color: message.role === 'user' ? 'white' : 'primary.main',
                                                            fontSize: '0.9rem'
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    ))}
                    {isTyping && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>AI</Avatar>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white', borderRadius: '2px' }}>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.palette.text.secondary }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.palette.text.secondary }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.palette.text.secondary }}
                                    />
                                </Box>
                            </Paper>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, background: theme.palette.background.default }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                            borderRadius: '2px',
                            bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white'
                        }}
                    >
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileAttach}
                        />
                        <IconButton sx={{ p: '10px' }} onClick={() => fileInputRef.current.click()}>
                            <AttachFile />
                        </IconButton>
                        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {attachedFiles.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1 }}>
                                    {attachedFiles.map((file, index) => (
                                        <Chip
                                            key={index}
                                            label={file.filename}
                                            onDelete={() => removeFile(index)}
                                            size="small"
                                            icon={file.processing ? <CircularProgress size={16} /> : <Description />}
                                            sx={{ borderRadius: '2px' }}
                                        />
                                    ))}
                                </Box>
                            )}
                            <TextField
                                fullWidth
                                placeholder="Type your message..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                variant="standard"
                                InputProps={{ disableUnderline: true, sx: { px: 1 } }}
                                multiline
                                maxRows={4}
                            />
                        </Box>
                        <IconButton 
                            color="primary" 
                            sx={{ p: '10px' }} 
                            onClick={handleSendMessage}
                            disabled={
                                (!inputMessage.trim() && attachedFiles.length === 0) || 
                                attachedFiles.some(f => f.processing || !f.processed)
                            }
                        >
                            <Send />
                        </IconButton>
                    </Paper>
                </Box>
            </Box>

            {/* Right Sidebar - Templates & Docs */}
            <Drawer
                variant="persistent"
                anchor="right"
                open={rightOpen}
                sx={{
                    width: DOC_SIDEBAR_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DOC_SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        background: mode === 'dark' ? '#000000' : '#f8fafc',
                        borderLeft: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        display: 'flex',
                        flexDirection: 'column'
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        DOCUMENTS
                    </Typography>
                    <IconButton onClick={() => setRightOpen(false)} size="small">
                        <ChevronRight />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

                <Box sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                        Templates
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {documentTemplates.map((template) => (
                            <Paper
                                key={template.id}
                                elevation={0}
                                onClick={() => handleDocumentTemplate(template)}
                                sx={{
                                    p: 1.5,
                                    cursor: 'pointer',
                                    background: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                    border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                    borderRadius: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        borderColor: 'primary.main',
                                        transform: 'translateX(4px)'
                                    }
                                }}
                            >
                                <Box 
                                    sx={{ 
                                        color: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {getDocumentIcon(template.icon)}
                                </Box>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontWeight: 600,
                                        color: mode === 'dark' ? '#fff' : '#000000' // Black in light mode as requested
                                    }}
                                >
                                    {template.name}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                </Box>

                <Divider sx={{ borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

                <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                    {/* Chat Specific Documents */}
                    {activeChat && (
                        <>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                                Documents in this Chat
                            </Typography>
                            <List disablePadding sx={{ mb: 3 }}>
                                {uploadedDocs.filter(doc => {
                                    const chatId = activeChat.id || activeChat._id;
                                    const docChatId = doc.chatId || (doc.metadata && doc.metadata.chatId);
                                    // Match by explicit chatId OR if doc ID is in conversation's documentIds
                                    return (docChatId === chatId) || (activeChat.documentIds && activeChat.documentIds.includes(doc.id || doc._id));
                                }).map((doc) => (
                                    <ListItem
                                        key={doc._id || doc.id}
                                        disablePadding
                                        sx={{ mb: 1 }}
                                    >
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                width: '100%',
                                                p: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                background: mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                                                border: `1px solid ${mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                                                borderRadius: '2px',
                                                minHeight: '40px'
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    width: 32,
                                                    height: 32
                                                }}
                                            >
                                                <Description fontSize="small" />
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {doc.filename || doc.originalName}
                                                </Typography>
                                                {doc.docType && (
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'primary.main', display: 'block' }}>
                                                        {doc.docType}
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    {new Date(doc.uploadDate || doc.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                 <Tooltip title="View">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => window.open(doc.s3Url || doc.url, '_blank')}
                                                        sx={{ color: 'primary.main' }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Paper>
                                    </ListItem>
                                ))}
                                {uploadedDocs.filter(doc => {
                                     const chatId = activeChat.id || activeChat._id;
                                     const docChatId = doc.chatId || (doc.metadata && doc.metadata.chatId);
                                     return (docChatId === chatId) || (activeChat.documentIds && activeChat.documentIds.includes(doc.id || doc._id));
                                }).length === 0 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}>
                                        No documents in this chat
                                    </Typography>
                                )}
                            </List>
                            <Divider sx={{ mb: 2, borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                        </>
                    )}

                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                        All Uploaded Files
                    </Typography>
                    <List disablePadding>
                        {uploadedDocs.map((doc) => (
                            <ListItem
                                key={doc._id}
                                disablePadding
                                sx={{ mb: 1 }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                                        borderRadius: '2px',
                                        minHeight: '40px'
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                                            color: 'primary.main',
                                            width: 32,
                                            height: 32
                                        }}
                                    >
                                        <Description fontSize="small" />
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
                                            {doc.filename}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                            {new Date(doc.uploadDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="Open in New Tab">
                                            <IconButton
                                                size="small"
                                                onClick={async () => {
                                                    try {
                                                        const result = await documentAPI.getDownloadUrl(doc.id || doc._id);
                                                        if (result.success && result.data.url) {
                                                            window.open(result.data.url, '_blank', 'noopener,noreferrer');
                                                        }
                                                    } catch (err) {
                                                        console.error('Error opening document:', err);
                                                    }
                                                }}
                                                sx={{ 
                                                    color: 'primary.main',
                                                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' }
                                                }}
                                            >
                                                <OpenInNew fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Download">
                                            <IconButton
                                                size="small"
                                                onClick={async () => {
                                                    try {
                                                        const result = await documentAPI.getDownloadUrl(doc.id || doc._id);
                                                        if (result.success && result.data.url) {
                                                            const link = document.createElement('a');
                                                            link.href = result.data.url;
                                                            link.download = result.data.filename || doc.filename;
                                                            link.target = '_blank';
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                        }
                                                    } catch (err) {
                                                        console.error('Error downloading document:', err);
                                                    }
                                                }}
                                                sx={{ 
                                                    color: 'success.main',
                                                    '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.1)' }
                                                }}
                                            >
                                                <Download fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setItemToDelete({ type: 'document', data: doc });
                                                    setDeleteDialogOpen(true);
                                                }}
                                                sx={{ 
                                                    color: 'error.main',
                                                    '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.1)' }
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Paper>
                            </ListItem>
                        ))}
                        {uploadedDocs.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No files uploaded yet
                            </Typography>
                        )}
                    </List>

                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, mt: 3, display: 'block' }}>
                        Generated Documents
                    </Typography>
                    <List disablePadding>
                        {generatedDocs.map((doc) => (
                            <ListItem
                                key={doc._id}
                                disablePadding
                                sx={{ mb: 1 }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                                        borderRadius: '2px',
                                        minHeight: '40px'
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                                            color: 'primary.main',
                                            width: 32,
                                            height: 32
                                        }}
                                    >
                                        <Description fontSize="small" />
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
                                            {doc.fileName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="Open in New Tab">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const url = doc.viewUrl || doc.htmlUrl;
                                                    if (!url) {
                                                        console.error('No viewUrl or htmlUrl available for document:', doc);
                                                        return;
                                                    }
                                                    const fullUrl = url.startsWith('http') ? url : `https://midl.comsats.edu.pk/legalize${url}`;
                                                    window.open(fullUrl, '_blank');
                                                }}
                                                sx={{ 
                                                    color: 'primary.main',
                                                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' }
                                                }}
                                            >
                                                <OpenInNew fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Download PDF">
                                            <IconButton
                                                size="small"
                                                onClick={async () => {
                                                    try {
                                                        setIsDownloading(true);
                                                        const url = doc.viewUrl || doc.htmlUrl;
                                                        if (!url) {
                                                            console.error('No viewUrl or htmlUrl available for document:', doc);
                                                            return;
                                                        }
                                                        const fullUrl = url.startsWith('http') ? url : `https://midl.comsats.edu.pk/legalize${url}`;
                                                        
                                                        // Fetch HTML content
                                                        const response = await fetch(fullUrl);
                                                        if (!response.ok) throw new Error('Failed to fetch document content');
                                                        const htmlContent = await response.text();

                                                        // Create temporary container with strict isolation
                                                        const container = document.createElement('div');
                                                        container.style.position = 'fixed';
                                                        container.style.top = '0';
                                                        container.style.left = '0';
                                                        container.style.width = '0';
                                                        container.style.height = '0';
                                                        container.style.overflow = 'hidden';
                                                        container.style.visibility = 'hidden';
                                                        container.style.zIndex = '-9999';
                                                        container.style.pointerEvents = 'none';
                                                        document.body.appendChild(container);

                                                        // Create the content element inside the container
                                                        const element = document.createElement('div');
                                                        element.innerHTML = htmlContent;
                                                        element.style.width = '210mm'; // A4 width
                                                        container.appendChild(element);

                                                        // Generate PDF
                                                        const opt = {
                                                            margin: 10,
                                                            filename: doc.fileName ? doc.fileName.replace('.html', '.pdf') : 'document.pdf',
                                                            image: { type: 'jpeg', quality: 0.98 },
                                                            html2canvas: { 
                                                                scale: 2, 
                                                                useCORS: true,
                                                                scrollX: 0,
                                                                scrollY: 0,
                                                                windowWidth: document.documentElement.offsetWidth,
                                                                windowHeight: document.documentElement.offsetHeight
                                                            },
                                                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                                        };

                                                        await html2pdf().set(opt).from(element).save();
                                                        
                                                        // Cleanup
                                                        document.body.removeChild(container);
                                                    } catch (error) {
                                                        console.error('PDF generation error:', error);
                                                        alert('Failed to generate PDF');
                                                    } finally {
                                                        setIsDownloading(false);
                                                    }
                                                }}
                                                sx={{ 
                                                    color: 'success.main',
                                                    '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.1)' }
                                                }}
                                            >
                                                <Download fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleDocMenuOpen(e, doc)}
                                                sx={{ 
                                                    color: 'error.main',
                                                    '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.1)' }
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Paper>
                            </ListItem>
                        ))}
                        {generatedDocs.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No documents generated yet
                            </Typography>
                        )}
                    </List>
                </Box>
            </Drawer>

            {/* Chat Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: '2px',
                        minWidth: 200
                    }
                }}
            >
                <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                    <Typography variant="caption" color="text.secondary">
                        Created: {menuChatDate ? new Date(menuChatDate).toLocaleString() : 'Unknown'}
                    </Typography>
                </Box>
                <MenuItem onClick={handleMenuDelete} sx={{ fontSize: '0.875rem', gap: 1, mt: 1 }}>
                    <Delete fontSize="small" color="error" />
                    <Typography color="error" variant="body2">Delete Chat</Typography>
                </MenuItem>
            </Menu>

            {/* Document Menu */}
            <Menu
                anchorEl={docMenuAnchorEl}
                open={Boolean(docMenuAnchorEl)}
                onClose={handleDocMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: '2px',
                        minWidth: 150
                    }
                }}
            >
                <MenuItem onClick={() => handleDeleteClick('document', selectedDoc)} sx={{ fontSize: '0.875rem', gap: 1 }}>
                    <Delete fontSize="small" />
                    Delete
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '2px',
                        border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        background: mode === 'dark' ? '#1e293b' : '#ffffff'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'text.secondary' }}>
                        Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ 
                            color: 'text.secondary',
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        sx={{ 
                            textTransform: 'none',
                            fontWeight: 500,
                            boxShadow: 'none',
                            borderRadius: '2px'
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
            {/* Full-screen compliance check overlay */}
            {isComplianceChecking && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        bgcolor: 'rgba(15, 23, 42, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2100,
                        backdropFilter: 'blur(2px)',
                        pointerEvents: 'all',
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            borderRadius: '8px',
                        }}
                    >
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" align="center">
                            Running compliance checkup on your document... This may take a moment.
                        </Typography>
                    </Paper>
                </Box>
            )}
            {/* Full-screen download overlay */}
            {isDownloading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        bgcolor: 'rgba(15, 23, 42, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        backdropFilter: 'blur(2px)',
                        pointerEvents: 'all',
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            borderRadius: '8px',
                        }}
                    >
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary">
                            Preparing your PDF download...
                        </Typography>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default ChatInterface;
