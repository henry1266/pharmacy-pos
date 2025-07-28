import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Container, 
  Alert, 
  Button,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Scheduling } from '../components';

// 定義介面
interface User {
  _id: string;
  name: string;
  role: string;
  email: string;
}

/**
 * 員工排班頁面
 * 顯示員工排班系統，提供月曆式排班功能
 */
const EmployeeSchedulingPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 初始化時獲取用戶資訊
  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        setError("無法讀取用戶資訊");
      }
    }
    setLoading(false);
  }, []);

  // 檢查用戶是否為管理員
  const isAdmin = user && user.role === 'admin';

  // 如果正在載入，顯示載入中訊息
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>載入中...</Typography>
        </Paper>
      </Container>
    );
  }

  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')}>
            返回儀表板
          </Button>
        </Paper>
      </Container>
    );
  }

  // 所有已登入用戶可見的內容
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            儀表板
          </Link>
          <Link color="inherit" href="/employees" onClick={(e) => { e.preventDefault(); navigate('/employees'); }}>
            員工管理
          </Link>
          <Typography color="text.primary">排班系統</Typography>
        </Breadcrumbs>
      </Box>
      
      <Scheduling isAdmin={!!isAdmin} />
    </Container>
  );
};

export default EmployeeSchedulingPage;