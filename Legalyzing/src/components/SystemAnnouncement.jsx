import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, IconButton, Paper, useTheme, 
    Dialog, DialogContent, Button, Zoom, Fade
} from '@mui/material';
import { Close, Campaign, NotificationsActive, Info } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SystemAnnouncement = () => {
    const [announcement, setAnnouncement] = useState(null);
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const theme = useTheme();

    useEffect(() => {
        // Only fetch if user is logged in
        if (!user) {
            setOpen(false);
            return;
        }

        const fetchSettings = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';
                const response = await axios.get(`${API_BASE}/auth/system-settings`);
                
                if (response.data.success) {
                    const { globalAnnouncement } = response.data.data;
                    
                    if (globalAnnouncement && globalAnnouncement.isActive) {
                        // Skip for superadmin per requirement
                        if (user?.role === 'superadmin') return;

                        setAnnouncement(globalAnnouncement);
                        
                        // User said: "always must be keep on popping everytime user logs in"
                        // So we remove the sessionStorage check and just show it
                        setTimeout(() => setOpen(true), 1200);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            }
        };

        fetchSettings();
    }, [user]);

    const handleClose = () => {
        setOpen(false);
    };

    if (!announcement || !user) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            TransitionComponent={Zoom}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                }
            }}
        >
            <Box sx={{ position: 'relative' }}>
                {/* Header Decoration */}
                <Box sx={{ 
                    height: 8, 
                    width: '100%', 
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }} />
                
                <IconButton
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 16,
                        color: theme.palette.text.secondary,
                        '&:hover': { background: 'rgba(0,0,0,0.05)' }
                    }}
                >
                    <Close fontSize="small" />
                </IconButton>

                <DialogContent sx={{ p: 5, textAlign: 'center' }}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mb: 3 
                    }}>
                        <Box sx={{ 
                            p: 2, 
                            borderRadius: '50%', 
                            bgcolor: `${theme.palette.primary.main}15`,
                            color: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <NotificationsActive sx={{ fontSize: 48 }} />
                        </Box>
                    </Box>

                    <Typography variant="h5" fontWeight="800" gutterBottom sx={{ color: theme.palette.text.primary }}>
                        System Announcement
                    </Typography>
                    
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            color: theme.palette.text.secondary, 
                            lineHeight: 1.6,
                            mb: 4,
                            px: 2
                        }}
                    >
                        {announcement.message}
                    </Typography>

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleClose}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 'bold',
                            boxShadow: `0 8px 16px ${theme.palette.primary.main}44`,
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        Acknowledge & Continue
                    </Button>
                </DialogContent>
            </Box>
        </Dialog>
    );
};

export default SystemAnnouncement;
