import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Alert,
  Button,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import PageHeaderSection from '../../../components/common/PageHeaderSection';
import {
  EmployeeForm
} from '../components';

// 定義 API 回應格式
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: Date;
}

// 定義介面
interface User {
  _id: string;
  name: string;
  role: string;
  email: string;
}

interface Employee {
  _id: string;
  name: string;
  gender: 'male' | 'female';
  department: string;
  position: string;
  phone: string;
  hireDate: string;
  email?: string;
  address?: string;
  birthDate?: string;
  idNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  [key: string]: any; // 允許其他屬性
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

/**
 * 員工基本資料頁面
 * 負責整體頁面布局、權限控制與狀態管理
 * 支援新增與編輯員工資料，並與後端 API 串接
 */
const EmployeeBasicInfoPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id = params.id;
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
      // 內聯定義獲取員工資料的函數，避免依賴問題
      const fetchData = async (): Promise<void> => {
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
  
          const response = await axios.get<ApiResponse<Employee>>(`/api/employees/${id}`, config);
          
          // 檢查 API 回應格式
          if (response.data?.success && response.data.data) {
            setEmployee(response.data.data);
          } else {
            throw new Error('員工資料格式不正確');
          }
          setError(null);
        } catch (err: any) {
          console.error('獲取員工資料失敗:', err);
          setError(err.response?.data?.message ?? err.response?.data?.msg ?? err.message ?? '獲取員工資料失敗');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isEditMode, id]);

  // 獲取員工資料 - 保留此函數以供其他地方使用
  const fetchEmployeeData = async (): Promise<void> => {
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

      const response = await axios.get<ApiResponse<Employee>>(`/api/employees/${id}`, config);
      
      // 檢查 API 回應格式
      if (response.data?.success && response.data.data) {
        setEmployee(response.data.data);
      } else {
        throw new Error('員工資料格式不正確');
      }
      setError(null);
    } catch (err: any) {
      console.error('獲取員工資料失敗:', err);
      setError(err.response?.data?.message ?? err.response?.data?.msg ?? err.message ?? '獲取員工資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理表單提交
  const handleSubmit = async (employeeData: any): Promise<void> => {
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
    } catch (err: any) {
      console.error('儲存員工資料失敗:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg ?? '儲存員工資料失敗',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 處理關閉提示訊息
  const handleCloseSnackbar = (): void => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 檢查用戶是否為管理員
  const isAdmin = user && user.role === 'admin';

  // 定義麵包屑導航項目
  const breadcrumbItems = [
    { icon: <HomeIcon fontSize="small" />, label: '首頁', path: '/' },
    { icon: <PeopleIcon fontSize="small" />, label: '員工管理', path: '/employees' },
    { icon: <PersonIcon fontSize="small" />, label: isEditMode ? '編輯資料' : '新增員工' },
  ];

  // 如果正在載入，顯示載入中訊息
  if (loading) {
    return (
      <Box sx={{ width: '80%', mx: 'auto' }}>
        <PageHeaderSection
          breadcrumbItems={breadcrumbItems}
        />
        <Paper sx={{ p: 3, my: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', boxShadow: 'none', border: 'none' }}>
          <CircularProgress size={30} />
          <Typography sx={{ ml: 2 }}>載入中...</Typography>
        </Paper>
      </Box>
    );
  }

  // 如果非管理員，顯示無權限訊息
  if (!isAdmin) {
    return (
      <Box sx={{ width: '80%', mx: 'auto' }}>
        <PageHeaderSection
          breadcrumbItems={breadcrumbItems}
        />
        <Paper sx={{ p: 3, my: 3, boxShadow: 'none', border: 'none' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            您沒有權限訪問此頁面。只有管理員可以管理員工基本資料。
          </Alert>
          <Button variant="outlined" color="primary" onClick={() => navigate('/dashboard')}>
            返回儀表板
          </Button>
        </Paper>
      </Box>
    );
  }

  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return (
      <Box sx={{ width: '80%', mx: 'auto' }}>
        <PageHeaderSection
          breadcrumbItems={breadcrumbItems}
        />
        <Paper sx={{ p: 3, my: 3, boxShadow: 'none', border: 'none' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" color="primary" onClick={() => navigate('/employees')}>
            返回員工列表
          </Button>
        </Paper>
      </Box>
    );
  }

  // 定義返回按鈕
  const actions = (
    <Button
      variant="outlined"
      size="small"
      onClick={() => navigate('/employees')}
      sx={{ minWidth: '80px' }}
    >
      返回
    </Button>
  );

  // 管理員可見的內容
  return (
    <Box sx={{ width: '80%', mx: 'auto' }}>
      <PageHeaderSection
        breadcrumbItems={breadcrumbItems}
        actions={actions}
      />
      
      <Paper sx={{ p: 3, my: 3, boxShadow: 'none', border: 'none' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? '編輯員工資料' : '新增員工'}
        </Typography>
        <EmployeeForm
          onSubmit={handleSubmit}
          initialData={employee as any}
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
    </Box>
  );
};

export default EmployeeBasicInfoPage;