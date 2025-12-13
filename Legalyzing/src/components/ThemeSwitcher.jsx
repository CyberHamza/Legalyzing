import React, { useState } from 'react';
import { Box, IconButton, Paper, Typography, Tooltip, Fade } from '@mui/material';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CloseIcon from '@mui/icons-material/Close';
import { useColorMode } from '../App';
import { PALETTES } from '../styles/themeConfig';

const ThemeSwitcher = () => {
  const { mode: currentTheme, setTheme, allThemes } = useColorMode();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <Fade in={isOpen}>
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            bottom: 60,
            right: 0,
            width: 260,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            mb: 1,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2" fontWeight="bold">Select Theme</Typography>
            <IconButton size="small" onClick={() => setIsOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
            {allThemes.map((themeKey) => {
              const theme = PALETTES[themeKey];
              const isActive = currentTheme === themeKey;
              
              return (
                <Tooltip key={themeKey} title={theme.name} placement="left">
                  <Box
                    onClick={() => setTheme(themeKey)}
                    sx={{
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: isActive ? 'primary.main' : 'transparent',
                      bgcolor: isActive ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: `conic-gradient(${theme.primary} 0deg 90deg, ${theme.secondary} 90deg 180deg, ${theme.accent} 180deg 270deg, ${theme.background} 270deg 360deg)`,
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: isActive ? '0 0 0 2px rgba(125,125,125,0.3)' : 'none'
                      }}
                    />
                    <Typography variant="caption" noWrap>
                      {theme.name}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Paper>
      </Fade>

      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        color="primary"
        sx={{
          width: 48,
          height: 48,
          bgcolor: 'background.paper',
          boxShadow: 4,
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': { bgcolor: 'background.default' }
        }}
      >
        <ColorLensIcon />
      </IconButton>
    </Box>
  );
};

export default ThemeSwitcher;
