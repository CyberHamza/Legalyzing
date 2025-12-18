import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getDesignTokens, getThemedCssVariables } from './styles/theme';
import { DEFAULT_THEME, PALETTES } from './styles/themeConfig';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Components
import ThemeSwitcher from './components/ThemeSwitcher';

// Pages
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ChatInterface from './pages/ChatInterface';
import DocumentForm from './pages/DocumentForm';
import VerifyEmail from './pages/VerifyEmail';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';

// Color Mode Context
export const ColorModeContext = createContext({ 
  setTheme: () => {},
  mode: DEFAULT_THEME,
  allThemes: [] 
});

export const useColorMode = () => useContext(ColorModeContext);

const THEME_STORAGE_KEY = 'legalyze-theme';

function App() {
  // Load theme from localStorage or default
  const [activeTheme, setActiveTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return (savedTheme && PALETTES[savedTheme]) ? savedTheme : DEFAULT_THEME;
  });

  // Inject CSS Variables for global styles (App.css compatibility)
  useEffect(() => {
    const cssVars = getThemedCssVariables(activeTheme);
    const root = document.documentElement;
    
    // Apply variables to root
    Object.keys(cssVars).forEach(key => {
      root.style.setProperty(key, cssVars[key]);
    });

    // Save persistence
    localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
  }, [activeTheme]);

  const colorMode = useMemo(
    () => ({
      setTheme: (themeKey) => {
        if (PALETTES[themeKey]) {
          setActiveTheme(themeKey);
        }
      },
      mode: activeTheme,
      allThemes: Object.keys(PALETTES),
    }),
    [activeTheme],
  );

  const theme = useMemo(() => createTheme(getDesignTokens(activeTheme)), [activeTheme]);

  return (
    <AuthProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/document/:type" element={<DocumentForm />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
            </Routes>
            {/* Theme Switcher removed - UI moved to LandingPage header */} 
          </Router>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AuthProvider>
  );
}

export default App;
