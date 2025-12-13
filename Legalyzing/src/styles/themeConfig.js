export const PALETTES = {
  palette1: {
    name: 'Matcha Tea',
    mode: 'light',
    colors: ['#6B8E23', '#8FBC8F', '#F0FFF0', '#FFFFFF'],
    primary: '#6B8E23', // Olive Drab
    secondary: '#8FBC8F',
    accent: '#556B2F',
    background: '#F5F9F5',
    surface: '#FFFFFF',
    text: { primary: '#2F3C18', secondary: '#556B2F' }
  },
  palette2: {
    name: 'Seafoam Breeze',
    mode: 'light',
    colors: ['#2E8B57', '#66CDAA', '#E0FFFF', '#FFFFFF'],
    primary: '#2E8B57', // Sea Green
    secondary: '#66CDAA', // Medium Aquamarine
    accent: '#20B2AA', // Light Sea Green
    background: '#F0FFFF', // Azure
    surface: '#FFFFFF',
    text: { primary: '#004D40', secondary: '#2E8B57' }
  },
  palette3: {
    name: 'Olive Earth',
    mode: 'light',
    colors: ['#B17F59', '#A5B68D', '#C1CFA1', '#EDE8DC'],
    primary: '#B17F59',
    secondary: '#A5B68D',
    accent: '#C1CFA1',
    background: '#EDE8DC',
    surface: '#F8F6F2', // Lighter than bg
    text: {
      primary: '#4a332a', 
      secondary: '#6d8058',
    }
  },
  palette4: {
    name: 'Midnight Teal',
    mode: 'dark',
    colors: ['#222831', '#31363F', '#76ABAE', '#EEEEEE'],
    primary: '#76ABAE',
    secondary: '#31363F',
    accent: '#5F8A8D',
    background: '#222831',
    surface: '#31363F',
    text: {
      primary: '#EEEEEE',
      secondary: '#B8BCC0',
    }
  },
  palette5: {
    name: 'Emerald Essence', 
    mode: 'light', 
    colors: ['#2E8B57', '#3CB371', '#F0FFF4', '#FFFFFF'],
    primary: '#2E8B57', // SeaGreen
    secondary: '#3CB371', // MediumSeaGreen
    accent: '#20B2AA', // LightSeaGreen
    background: '#F0FFF4', // Honeydew (Very light green)
    surface: '#FFFFFF',
    text: { 
      primary: '#1B4D3E', // Dark Green Text
      secondary: '#2E8B57' 
    }
  },
  palette6: {
    name: 'Sage Sanctuary', 
    mode: 'light',
    colors: ['#556B2F', '#8FBC8F', '#F5F5F5', '#FFFFFF'],
    primary: '#556B2F', // DarkOliveGreen
    secondary: '#8FBC8F', // DarkSeaGreen
    accent: '#6B8E23', // OliveDrab
    background: '#FAFAF5', // Off-white warm
    surface: '#FFFFFF',
    text: { 
      primary: '#3A4A20', 
      secondary: '#556B2F' 
    }
  }
};

export const DEFAULT_THEME = 'palette4'; // Midnight Teal as default (popular dark mode)
