import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for API calls

// TODO: Implement proper global state management (Context or Redux) to store user info and token

/**
 * Login Page Component
 * @returns {React.ReactElement} Login Page
 */
const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: '', // Changed from username to email
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the backend API for authentication
      const response = await axios.post('/api/auth', {
        email: credentials.email,
        password: credentials.password
      });

      // Assuming the API returns a token on success
      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Set axios default header for subsequent requests
        axios.defaults.headers.common['x-auth-token'] = response.data.token;

        // TODO: Fetch user details and update global state
        
        // Navigate to the dashboard or another protected route
        navigate('/dashboard'); 
      } else {
        // Handle cases where token is not returned (should not happen on success)
        setError('登入失敗，未收到驗證資訊。');
        setSnackbar({ open: true, message: '登入失敗，未收到驗證資訊。', severity: 'error' });
      }

    } catch (err) {
      console.error('Login error:', err.response || err.message);
      let errorMessage = '登入失敗，請檢查您的憑證或稍後再試。';
      if (err.response && err.response.data && err.response.data.msg) {
        errorMessage = err.response.data.msg; // Use specific error message from backend if available
      } else if (err.response && err.response.data && err.response.data.errors) {
        // Handle validation errors
        errorMessage = err.response.data.errors.map(e => e.msg).join(', ');
      }
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          藥局POS系統
        </Typography>
        <Typography variant="subtitle1" align="center" color="textSecondary" sx={{ mb: 3 }}>
          請登入以繼續
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="電子郵件"
                name="email" // Changed from username to email
                type="email" // Set type to email for basic validation
                value={credentials.email}
                onChange={handleChange}
                variant="outlined"
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="密碼"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                variant="outlined"
                required
                disabled={loading}
              />
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Typography color="error" align="center" variant="body2">
                  {error}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 1 }}
                disabled={loading}
              >
                {loading ? '登入中...' : '登入'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;

