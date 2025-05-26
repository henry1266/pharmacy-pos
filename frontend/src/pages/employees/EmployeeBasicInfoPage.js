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
  Snackbar,
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import EmployeeForm from '../../components/employees/EmployeeForm';

/**
 * 員工基本資料頁面
 * 負責整體頁面布局、權限控制與狀態管理
 * 支援新增與編輯員工資料，並與後端 API 串接
 */
const EmployeeBasicInfoPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = id && id !== 'new';

  // 從 localStorage 獲取用戶資訊與 token
  useEffect(() => {
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
    
    // 如果是編輯模式，獲取員工資料
    if (isEditMode) {
      fetchEmployeeData();
    } else {
      setLoading(false);
    }
  }, [isEditMode, id]);

  // 獲取員工資料
  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未登入或權限不足');
      }

      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      const response = await axios.get(`/api/employees/${id}`, config);
      setEmployee(response.data);
      setError(null);
    } catch (err) {
      console.error('獲取員工資料失敗:', err);
      setError(err.response?.data?.msg || '獲取員工資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理表單提交
  const handleSubmit = async (employeeData) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未登入或權限不足');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      if (isEditMode) {
        // 更新員工資料
        await axios.put(`/api/employees/${id}`, employeeData, config);
        setSnackbar({
          open: true,
          message: '員工資料已成功更新！',
          severity: 'success'
        });
      } else {
        // 新增員工資料
        await axios.post('/api/employees', employeeData, config);
        setSnackbar({
          open: true,
          message: '員工資料已成功新增！',
          severity: 'success'
        });
      }

      // 更新成功後，導航回員工列表頁面
      setTimeout(() => {
        navigate('/employees');
      }, 2000);
    } catch (err) {
      console.error('儲存員工資料失敗:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || '儲存員工資料失敗',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 處理關閉提示訊息
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

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

  // 如果非管理員，顯示無權限訊息
  if (!isAdmin) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            您沒有權限訪問此頁面。只有管理員可以管理員工基本資料。
          </Alert>
          <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')}>
            返回儀表板
          </Button>
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
          <Button variant="contained" color="primary" onClick={() => navigate('/employees')}>
            返回員工列表
          </Button>
        </Paper>
      </Container>
    );
  }

  // 管理員可見的內容
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            儀表板
          </Link>
          <Link color="inherit" href="/employees" onClick={(e) => { e.preventDefault(); navigate('/employees'); }}>
            員工列表
          </Link>
          <Typography color="text.primary">{isEditMode ? '編輯員工資料' : '新增員工'}</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? '編輯員工資料' : '新增員工'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          請填寫員工基本資料表，所有標記 * 的欄位為必填項目。
        </Typography>
        
        <EmployeeForm 
          onSubmit={handleSubmit} 
          initialData={employee} 
          isSubmitting={submitting}
        />
      </Paper>

      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmployeeBasicInfoPage;
