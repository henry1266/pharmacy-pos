import React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MainLayout from './components/layout/MainLayout';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './AppRouter';
import './assets/css/dashui-theme.css';

// 創建自定義主題
const theme = createTheme({
  palette: {
    primary: {
      main: '#624bff',
      light: '#e5e1ff',
      dark: '#5040d9',
    },
    secondary: {
      main: '#6c757d',
    },
    success: {
      main: '#00d97e',
    },
    error: {
      main: '#e53f3c',
    },
    warning: {
      main: '#f5a623',
    },
    info: {
      main: '#39afd1',
    },
    background: {
      default: '#f5f4f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainLayout>
          <AppRouter />
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
