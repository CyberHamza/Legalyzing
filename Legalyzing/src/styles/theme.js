import { createTheme } from '@mui/material/styles';

export const getDesignTokens = (mode) => ({
    palette: {
        mode,
        ...(mode === 'dark'
            ? {
                // Dark Mode Palette (Current)
                primary: {
                    main: '#6366f1', // Indigo
                    light: '#818cf8',
                    dark: '#4f46e5',
                },
                secondary: {
                    main: '#06b6d4', // Cyan
                    light: '#22d3ee',
                    dark: '#0891b2',
                },
                background: {
                    default: '#0f172a', // Slate 900
                    paper: '#1e293b',   // Slate 800
                },
                text: {
                    primary: '#ffffff',
                    secondary: '#94a3b8', // Slate 400
                },
            }
            : {
                // Light Mode Palette
                primary: {
                    main: '#4f46e5', // Indigo 600
                    light: '#6366f1',
                    dark: '#4338ca',
                },
                secondary: {
                    main: '#0891b2', // Cyan 600
                    light: '#06b6d4',
                    dark: '#0e7490',
                },
                background: {
                    default: '#f8fafc', // Slate 50
                    paper: '#ffffff',   // White
                },
                text: {
                    primary: '#0f172a', // Slate 900
                    secondary: '#475569', // Slate 600
                },
            }),
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 800,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
        },
    },
    shape: {
        borderRadius: 1, // Global 1px border radius
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '1px', // Enforce 1px border radius
                    padding: '10px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                },
                containedPrimary: {
                    background: mode === 'dark' 
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                        : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '1px', // Enforce 1px border radius
                    backgroundImage: 'none',
                    backgroundColor: mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '1px', // Enforce 1px border radius
                        backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.6)',
                        '& fieldset': {
                            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        },
                        '&:hover fieldset': {
                            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                        },
                    },
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: mode === 'dark' ? "#6b6b6b #2b2b2b" : "#959595 #f5f5f5",
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        backgroundColor: mode === 'dark' ? "#2b2b2b" : "#f5f5f5",
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        backgroundColor: mode === 'dark' ? "#6b6b6b" : "#959595",
                        minHeight: 24,
                        border: mode === 'dark' ? "3px solid #2b2b2b" : "3px solid #f5f5f5",
                    },
                    "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
                        backgroundColor: mode === 'dark' ? "#959595" : "#6b6b6b",
                    },
                    "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
                        backgroundColor: mode === 'dark' ? "#959595" : "#6b6b6b",
                    },
                    "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: mode === 'dark' ? "#959595" : "#6b6b6b",
                    },
                    "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
                        backgroundColor: mode === 'dark' ? "#2b2b2b" : "#f5f5f5",
                    },
                },
            },
        },
    },
});

// Default theme for backward compatibility if needed immediately, 
// but App.jsx will handle the dynamic creation.
const theme = createTheme(getDesignTokens('dark'));

export default theme;
