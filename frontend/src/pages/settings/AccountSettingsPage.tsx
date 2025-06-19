import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { Theme, SxProps } from '@mui/material/styles';
import authService from '../../services/authService';

// 定義用戶介面
interface User {
  _id: string;
  name: string;
  username: string;
  email?: string;
  role: string;
}

// 定義表單數據介面
interface FormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 定義表單錯誤介面
interface FormErrors {
  [key: string]: string;
}

// 定義提示訊息介面
interface AlertState {
  show: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

/**
 * 帳號設定頁面
 * 允許用戶查看和更新自己的帳號資訊
 */
const AccountSettingsPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<AlertState>({ show: false, message: '', severity: 'info' });

  // 渲染 Paper 內容
  const renderPaperContent = (): JSX.Element => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>載入中...</Typography>
        </Box>
      );
    }
    
    if (!currentUser) {
      return (
        <Alert severity="warning">
          無法獲取用戶資訊，請確認您已登入系統
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        <Grid {...{ item: true, xs: 12 } as any}>
          <Typography variant="h6" gutterBottom>基本資訊</Typography>
        </Grid>

        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            姓名
          </Typography>
          <Typography variant="body1">
            {currentUser.name}
          </Typography>
        </Grid>
        
        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            角色
          </Typography>
          <Chip
            label={getRoleName(currentUser.role)}
            color={getRoleColor(currentUser.role)}
            size="small"
          />
        </Grid>

        <Grid {...{ item: true, xs: 12 } as any}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>帳號設定</Typography>
        </Grid>

        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <TextField
            fullWidth
            label="用戶名"
            variant="outlined"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            error={!!formErrors.username}
            helperText={formErrors.username || "用於系統登入的用戶名"}
          />
        </Grid>
        
        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <TextField
            fullWidth
            label="電子郵件 (選填)"
            variant="outlined"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
        </Grid>

        <Grid {...{ item: true, xs: 12 } as any}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>變更密碼</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            如不需變更密碼，請留空以下欄位
          </Typography>
        </Grid>
        
        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <TextField
            fullWidth
            label="當前密碼"
            variant="outlined"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange}
            error={!!formErrors.currentPassword}
            helperText={formErrors.currentPassword}
          />
        </Grid>
        
        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <TextField
            fullWidth
            label="新密碼"
            variant="outlined"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange}
            error={!!formErrors.newPassword}
            helperText={formErrors.newPassword || "密碼長度至少需要6個字符"}
          />
        </Grid>
        
        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <TextField
            fullWidth
            label="確認新密碼"
            variant="outlined"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
          />
        </Grid>

        <Grid {...{ item: true, xs: 12, sx: { mt: 2, display: 'flex', justifyContent: 'flex-end' } } as any}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveAccount}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSaving ? '保存中...' : '保存設定'}
          </Button>
        </Grid>
      </Grid>
    );
  };

  // 獲取當前用戶資訊
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // 獲取當前用戶資訊
  const fetchCurrentUser = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
      setFormData({
        ...formData,
        username: userData.username || '',
        email: userData.email || ''
      });
    } catch (error: any) {
      setAlert({
        show: true,
        message: '獲取用戶資訊失敗: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 處理表單輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 清除對應欄位的錯誤訊息
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // 驗證表單
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const { username, currentPassword, newPassword, confirmPassword } = formData;

    if (!currentUser) return false;

    if (username !== currentUser.username && !username) {
      errors.username = '用戶名不能為空';
    }

    if (newPassword) {
      if (!currentPassword) {
        errors.currentPassword = '請輸入當前密碼';
      }
      
      if (newPassword.length < 6) {
        errors.newPassword = '新密碼長度至少需要6個字符';
      }

      if (newPassword !== confirmPassword) {
        errors.confirmPassword = '兩次輸入的密碼不一致';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 處理保存帳號設定
  const handleSaveAccount = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const updateData: Record<string, string | undefined> = {};
      
      // 只更新有變更的欄位
      if (currentUser && formData.username !== currentUser.username) {
        updateData.username = formData.username;
      }
      
      if (currentUser && formData.email !== currentUser.email) {
        updateData.email = formData.email || undefined;
      }
      
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // 如果沒有任何變更，直接返回
      if (Object.keys(updateData).length === 0) {
        setAlert({
          show: true,
          message: '沒有任何變更',
          severity: 'info'
        });
        setIsSaving(false);
        return;
      }

      // 更新用戶資訊
      await authService.updateCurrentUser(updateData);
      
      // 重新獲取用戶資訊
      await fetchCurrentUser();
      
      // 清空密碼欄位
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setAlert({
        show: true,
        message: '帳號設定已更新',
        severity: 'success'
      });
    } catch (error: any) {
      setAlert({
        show: true,
        message: '更新帳號設定失敗: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 獲取角色中文名稱
  const getRoleName = (role: string): string => {
    switch (role) {
      case 'admin':
        return '管理員';
      case 'pharmacist':
        return '藥師';
      case 'staff':
        return '員工';
      default:
        return role;
    }
  };

  // 獲取角色顏色
  const getRoleColor = (role: string): "error" | "success" | "primary" | "default" => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'pharmacist':
        return 'success';
      case 'staff':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>帳號管理</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        在此頁面您可以查看和更新您的帳號資訊
      </Typography>

      {alert.show && (
        <Alert 
          severity={alert.severity} 
          sx={{ mb: 3 }}
          onClose={() => setAlert({ ...alert, show: false })}
        >
          {alert.message}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        {renderPaperContent()}
      </Paper>
    </Box>
  );
};

export default AccountSettingsPage;