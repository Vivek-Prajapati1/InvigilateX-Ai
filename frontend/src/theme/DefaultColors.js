import { createTheme } from "@mui/material/styles";
import typography from "./Typography";
import { shadows } from "./Shadows";

const baselightTheme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#159fc1', // cyan-blue from logo
      light: '#41bcba',
      dark: '#0b7f98',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c52d84', // magenta from logo
      light: '#ed93c7',
      dark: '#8e1f5e',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a',
      light: '#dcfce7',
      dark: '#15803d',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0ea5e9',
      light: '#e0f2fe',
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#fee2e2',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    purple: {
      A50: '#f5f3ff',
      A100: '#7c3aed',
      A200: '#6d28d9',
    },
    grey: {
      100: '#F4F7FA',
      200: '#EAEFF4',
      300: '#DFE5EF',
      400: '#7C8FAC',
      500: '#5A6A85',
      600: '#1f2937',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
    },
    background: {
      default: '#f8fbfb',
      paper: '#ffffff',
    },
    action: {
      disabledBackground: 'rgba(73,82,88,0.12)',
      hoverOpacity: 0.06,
      hover: '#f1f5f9',
    },
    divider: '#e5eaef',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    ...typography,
    h1: { ...typography.h1, letterSpacing: 0.2 },
    h2: { ...typography.h2, letterSpacing: 0.2 },
    button: { ...typography.button, fontWeight: 600 },
  },
  shadows
});

export { baselightTheme };
