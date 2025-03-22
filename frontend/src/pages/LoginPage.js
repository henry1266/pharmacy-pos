import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * 登入頁面組件
 * @returns {React.ReactElement} 登入頁面
 */
const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 這裡應該調用API進行身份驗證
    // 模擬登入成功
    if (credentials.username && credentials.password) {
      // 儲存令牌到本地存儲
      localStorage.setItem('token', 'sample-token');
      // 導航到儀表板
      navigate('/dashboard');
    } else {
      setError('請輸入用戶名和密碼');
    }
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
                label="用戶名"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                variant="outlined"
                required
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
              />
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Typography color="error" align="center">
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
              >
                登入
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;
