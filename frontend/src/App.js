import React, { useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage'; // Import LoginPage
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppRouter from './AppRouter'; // This will contain protected routes
import axios from 'axios'; // Import axios to set default header
import './assets/css/dashui-theme.css';
import PropTypes from 'prop-types'; // Import PropTypes for validation

// 創建自定義主題 (Keep theme definition as is)
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
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#000000', // Set text color to black
        },
      },
    },
  },
});

// Simple check for authentication token
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  // Implemented token validation by checking if token exists and is not expired
  if (token) {
    try {
      // Basic check - in production, should use proper JWT validation
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
      return Date.now() < expirationTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
  return false;
};

// Component to handle protected routes
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected.
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Add PropTypes validation for ProtectedRoute
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

function App() {
  // Set axios default header if token exists (on initial load)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
    // Basic listener for storage changes to update auth status (optional, might need more robust state management)
    const handleStorageChange = () => {
        // Force re-render or update state if needed
        window.location.reload(); // Simplest way, but not ideal UX
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes - Wrap MainLayout and AppRouter */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AppRouter /> { /* AppRouter now contains only protected routes */}
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
