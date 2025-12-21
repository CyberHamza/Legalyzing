import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Collapse, Paper, useTheme } from '@mui/material';
import { Close, InfoOutlined, WarningAmber, ErrorOutline, Campaign } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const SystemAnnouncement = () => {
    const [announcement, setAnnouncement] = useState(null);
    const [visible, setVisible] = useState(false);
    const { user } = useAuth();
    const theme = useTheme();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Use absolute URL or relative if proxy setup
                const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
                console.log('Fetching system settings from:', API_BASE);
                const response = await axios.get(`${API_BASE}/auth/system-settings`);
                console.log('System settings response:', response.data);
                
                if (response.data.success) {
                    const { globalAnnouncement } = response.data.data;
                    console.log('Global Announcement Data:', globalAnnouncement);
                    console.log('Current User Role:', user?.role);
                    
                    // Check if announcement is active
                    if (globalAnnouncement && globalAnnouncement.isActive) {
                        // Don't show to superadmin if requested (User said "except suepr admin")
                        if (user?.role === 'superadmin') {
                            console.log('Skipping announcement for superadmin');
                            return;
                        }

                        setAnnouncement(globalAnnouncement);
                        // Check session storage to see if already dismissed this session
                        const dismissed = sessionStorage.getItem(`announcement-dismissed-${globalAnnouncement.message}`);
                        console.log('Is dismissed?', dismissed);
                        if (!dismissed) {
                            setVisible(true);
                        }
                    } else {
                        console.log('Announcement is not active or null');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            }
        };

        fetchSettings();
    }, [user]);

    const handleClose = () => {
        setVisible(false);
        if (announcement) {
            sessionStorage.setItem(`announcement-dismissed-${announcement.message}`, 'true');
        }
    };

    if (!announcement || !visible) return null;

    const getIcon = () => {
        switch (announcement.type) {
            case 'warning': return <WarningAmber />;
            case 'error': return <ErrorOutline />;
            default: return <Campaign />;
        }
    };

    const getColors = () => {
        const isDark = theme.palette.mode === 'dark';
        switch (announcement.type) {
            case 'warning':
                return {
                    bg: isDark ? 'rgba(237, 108, 2, 0.15)' : '#fff4e5',
                    border: isDark ? '#ed6c02' : '#ff9800',
                    text: isDark ? '#ffcc80' : '#663c00'
                };
            case 'error':
                return {
                    bg: isDark ? 'rgba(211, 47, 47, 0.15)' : '#fdeded',
                    border: isDark ? '#d32f2f' : '#f44336',
                    text: isDark ? '#ffcdd2' : '#5f2120'
                };
            default: // info/blue
                return {
                    bg: isDark ? 'rgba(2, 136, 209, 0.15)' : '#e3f2fd',
                    border: isDark ? '#0288d1' : '#2196f3',
                    text: isDark ? '#b3e5fc' : '#0d47a1'
                };
        }
    };

    const colors = getColors();

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Box sx={{ width: '100%', px: 0 }}>
                        <Paper
                            elevation={0}
                            square
                            sx={{
                                background: `linear-gradient(90deg, ${colors.bg} 0%, ${theme.palette.background.paper} 100%)`,
                                borderBottom: `1px solid ${colors.border}`,
                                borderLeft: `4px solid ${colors.border}`,
                                py: 1.5,
                                px: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1, flex: 1 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: colors.border,
                                        p: 1,
                                        borderRadius: '50%',
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)'
                                    }}
                                >
                                    {getIcon()}
                                </Box>
                                <Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        sx={{ 
                                            fontWeight: 700, 
                                            color: colors.border,
                                            textTransform: 'uppercase',
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        System Announcement
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: theme.palette.text.primary,
                                            fontWeight: 500
                                        }}
                                    >
                                        {announcement.message}
                                    </Typography>
                                </Box>
                            </Box>

                            <IconButton 
                                size="small" 
                                onClick={handleClose}
                                sx={{ 
                                    color: theme.palette.text.secondary,
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                                }}
                            >
                                <Close fontSize="small" />
                            </IconButton>

                            {/* Decorative Blur */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    right: -20,
                                    top: -20,
                                    width: 100,
                                    height: 100,
                                    bgcolor: colors.border,
                                    opacity: 0.1,
                                    borderRadius: '50%',
                                    pointerEvents: 'none'
                                }}
                            />
                        </Paper>
                    </Box>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SystemAnnouncement;
