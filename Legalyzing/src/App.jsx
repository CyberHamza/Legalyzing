import React, { useState, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getDesignTokens } from './styles/theme';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Pages
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ChatInterface from './pages/ChatInterface';
import DocumentForm from './pages/DocumentForm';
import VerifyEmail from './pages/VerifyEmail';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';

// Color Mode Context
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

function App() {
  const [mode, setMode] = useState('dark');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode, // Export current mode for components to use if needed
    }),
    [mode],
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

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
          </Router>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AuthProvider>
  );
}

export default App;
