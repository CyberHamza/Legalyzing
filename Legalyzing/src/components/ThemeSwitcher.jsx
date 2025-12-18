import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useColorMode } from '../App';
import { PALETTES } from '../styles/themeConfig';

const ThemeSwitcher = () => {
  const { mode: currentTheme, setTheme, allThemes } = useColorMode();
  const handleThemeChange = () => {
    const currentIndex = allThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % allThemes.length;
    const nextTheme = allThemes[nextIndex];
    setTheme(nextTheme);
  };

  return (
    <Tooltip title={`Current Theme: ${PALETTES[currentTheme]?.name || currentTheme} (Click to change)`}>
      <Box sx={{ position: 'fixed', top: 16, right: 100, zIndex: 9999 }}>
        <IconButton
          onClick={handleThemeChange}
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'background.paper',
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': { 
              bgcolor: 'background.default',
              transform: 'rotate(45deg)'
            }
          }}
        >
          <ColorLensIcon color="primary" />
        </IconButton>
      </Box>
    </Tooltip>
  );
};

export default ThemeSwitcher;
