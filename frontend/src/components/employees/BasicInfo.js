import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Container, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const BasicInfo = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }
    }
    setLoading(false);
  }, []);

  // 檢查用戶是否為管理員
  const isAdmin = user && user.role === 'admin';

  // 如果非管理員，顯示無權限訊息
  if (!loading && !isAdmin) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            您沒有權限訪問此頁面。只有管理員可以查看員工基本資料。
          </Alert>
          <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')}>
            返回儀表板
          </Button>
        </Paper>
      </Container>
    );
  }

  // 管理員可見的內容
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          員工基本資料
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            此頁面將用於管理員工的基本資料，包含個人資訊、聯絡方式、職位等資訊。
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>
            注意：此頁面僅限管理員訪問。
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default BasicInfo;
