import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { syncMongoDBConfig } from '../../utils/configSync';
import authService from '../../services/authService';

/**
 * 用戶資訊介面
 */
interface UserData {
  username?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

/**
 * 帳號表單資料介面
 */
interface AccountFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 帳號表單錯誤介面
 */
interface AccountFormErrors {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

/**
 * 提示訊息介面
 */
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

/**
 * 設定彈出窗口組件屬性
 */
interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 設定彈出窗口組件
 */
const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  // 從localStorage獲取當前IP設定，如果沒有則使用默認值
  const [apiIpAddress, setApiIpAddress] = useState<string>('');
  const [mongodbIpAddress, setMongodbIpAddress] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [tabValue, setTabValue] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [accountFormData, setAccountFormData] = useState<AccountFormData>({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [accountFormErrors, setAccountFormErrors] = useState<AccountFormErrors>({});

  // 初始化時從localStorage讀取IP設定
  useEffect(() => {
    const savedApiIp = localStorage.getItem('apiServerIp');
    if (savedApiIp) {
      setApiIpAddress(savedApiIp);
    } else {
      // 默認值，從當前apiService配置中獲取
      setApiIpAddress(process.env.REACT_APP_DEFAULT_API_IP ?? '192.168.68.90'); // Use env var or fallback
    }

    const savedMongodbIp = localStorage.getItem('mongodbServerIp');
    if (savedMongodbIp) {
      setMongodbIpAddress(savedMongodbIp);
    } else {
      // 默認值，通常與API伺服器相同
      setMongodbIpAddress(process.env.REACT_APP_DEFAULT_MONGODB_IP ?? '192.168.68.90'); // Use env var or fallback
    }
  }, [open]);

  // 獲取當前用戶資訊
  useEffect(() => {
    if (open && tabValue === 1) {
      fetchCurrentUser();
    }
  }, [open, tabValue]);

  // 獲取當前用戶資訊
  const fetchCurrentUser = async (): Promise<void> => {
    setIsLoadingUser(true);
    try {
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
      setAccountFormData({
        ...accountFormData,
        username: userData.username ?? '',
        email: userData.email ?? ''
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: '獲取用戶資訊失敗: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsLoadingUser(false);
    }
  };

  // 處理標籤頁變更
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };

  // 處理API IP地址輸入變更
  const handleApiIpChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setApiIpAddress(e.target.value);
  };

  // 處理MongoDB IP地址輸入變更
  const handleMongodbIpChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMongodbIpAddress(e.target.value);
  };

  // 處理帳號表單輸入變更
  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setAccountFormData({
      ...accountFormData,
      [name]: value
    });

    // 清除對應欄位的錯誤訊息
    if (accountFormErrors[name]) {
      setAccountFormErrors({
        ...accountFormErrors,
        [name]: ''
      });
    }
  };

  // 處理保存設定
  const handleSave = async (): Promise<void> => {
    // 驗證IP地址格式 - 使用 \d 替代 [0-9]
    // Simplified IP regex with reduced complexity
    const ipRegex = /^(25[0-5]|2[0-4]\d|1\d\d|\d\d|\d)(\.(25[0-5]|2[0-4]\d|1\d\d|\d\d|\d)){3}$/;
    
    if (!ipRegex.test(apiIpAddress)) {
      setSnackbar({
        open: true,
        message: 'API伺服器IP地址格式不正確，請輸入有效的IP地址',
        severity: 'error'
      });
      return;
    }

    if (!ipRegex.test(mongodbIpAddress)) {
      setSnackbar({
        open: true,
        message: 'MongoDB伺服器IP地址格式不正確，請輸入有效的IP地址',
        severity: 'error'
      });
      return;
    }

    // 設置保存中狀態
    setIsSaving(true);

    try {
      // 保存IP地址到localStorage
      localStorage.setItem('apiServerIp', apiIpAddress);
      localStorage.setItem('mongodbServerIp', mongodbIpAddress);
      
      // 同步MongoDB設定到後端
      await syncMongoDBConfig(mongodbIpAddress);
      
      // 顯示成功提示
      setSnackbar({
        open: true,
        message: 'IP設定已保存並同步到後端，請重新整理頁面以套用更改',
        severity: 'success'
      });
      
      // 關閉彈出窗口
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      // 顯示錯誤提示
      setSnackbar({
        open: true,
        message: `MongoDB設定同步失敗: ${error.message}`,
        severity: 'error'
      });
    } finally {
      // 取消保存中狀態
      setIsSaving(false);
    }
  };

  // 驗證帳號表單
  const validateAccountForm = (): boolean => {
    const errors: AccountFormErrors = {};
    const { username, currentPassword, newPassword, confirmPassword } = accountFormData;

    if (currentUser && username !== currentUser.username && !username) {
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

    setAccountFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 處理保存帳號設定
  const handleSaveAccount = async (): Promise<void> => {
    if (!validateAccountForm()) return;

    setIsSaving(true);
    try {
      const updateData: Record<string, any> = {};
      
      // 只更新有變更的欄位
      if (currentUser && accountFormData.username !== currentUser.username) {
        updateData.username = accountFormData.username;
      }
      
      if (currentUser && accountFormData.email !== currentUser.email) {
        updateData.email = accountFormData.email ?? undefined;
      }
      
      if (accountFormData.newPassword) {
        updateData.currentPassword = accountFormData.currentPassword;
        updateData.newPassword = accountFormData.newPassword;
      }

      // 如果沒有任何變更，直接返回
      if (Object.keys(updateData).length === 0) {
        setSnackbar({
          open: true,
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
      setAccountFormData({
        ...accountFormData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSnackbar({
        open: true,
        message: '帳號設定已更新',
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: '更新帳號設定失敗: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 處理關閉提示
  const handleCloseSnackbar = (): void => {
    setSnackbar({
      ...snackbar,
      open: false
    });
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
  const getRoleColor = (role: string): 'error' | 'success' | 'primary' | 'default' => {
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
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>系統設定</DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="設定選項">
            <Tab label="伺服器設定" id="tab-0" />
            <Tab label="帳號管理" id="tab-1" />
          </Tabs>
        </Box>
        <DialogContent>
          {tabValue === 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                API伺服器設定
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                請輸入API伺服器的IP地址，例如：192.168.68.90
              </Typography>
              <TextField
                fullWidth
                label="API伺服器IP地址"
                variant="outlined"
                value={apiIpAddress}
                onChange={handleApiIpChange}
                placeholder="例如：192.168.68.90"
                helperText="設定後需要重新整理頁面以套用更改"
                sx={{ mb: 3 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                MongoDB伺服器設定
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                請輸入MongoDB資料庫伺服器的IP地址，例如：192.168.68.90
              </Typography>
              <TextField
                fullWidth
                label="MongoDB伺服器IP地址"
                variant="outlined"
                value={mongodbIpAddress}
                onChange={handleMongodbIpChange}
                placeholder="例如：192.168.68.90"
                helperText="設定後需要重新整理頁面以套用更改"
                sx={{ mb: 2 }}
              />
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                帳號管理
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                管理您的系統帳號資訊
              </Typography>
              
              {/* 使用獨立的條件判斷替代巢狀三元運算子 */}
              {isLoadingUser && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ ml: 2 }}>載入中...</Typography>
                </Box>
              )}
              
              {!isLoadingUser && currentUser && (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      姓名
                    </Typography>
                    <Typography variant="body1">
                      {currentUser.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      角色
                    </Typography>
                    <Chip
                      label={currentUser.role ? getRoleName(currentUser.role) : ''}
                      color={currentUser.role ? getRoleColor(currentUser.role) : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="用戶名"
                    variant="outlined"
                    name="username"
                    value={accountFormData.username}
                    onChange={handleAccountInputChange}
                    error={!!accountFormErrors.username}
                    helperText={accountFormErrors.username ?? "用於系統登入的用戶名"}
                    sx={{ mb: 3 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="電子郵件 (選填)"
                    variant="outlined"
                    name="email"
                    type="email"
                    value={accountFormData.email}
                    onChange={handleAccountInputChange}
                    error={!!accountFormErrors.email}
                    helperText={accountFormErrors.email}
                    sx={{ mb: 3 }}
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    變更密碼
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="當前密碼"
                    variant="outlined"
                    name="currentPassword"
                    type="password"
                    value={accountFormData.currentPassword}
                    onChange={handleAccountInputChange}
                    error={!!accountFormErrors.currentPassword}
                    helperText={accountFormErrors.currentPassword}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="新密碼"
                    variant="outlined"
                    name="newPassword"
                    type="password"
                    value={accountFormData.newPassword}
                    onChange={handleAccountInputChange}
                    error={!!accountFormErrors.newPassword}
                    helperText={accountFormErrors.newPassword ?? "如不變更密碼，請留空"}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="確認新密碼"
                    variant="outlined"
                    name="confirmPassword"
                    type="password"
                    value={accountFormData.confirmPassword}
                    onChange={handleAccountInputChange}
                    error={!!accountFormErrors.confirmPassword}
                    helperText={accountFormErrors.confirmPassword}
                    sx={{ mb: 2 }}
                  />
                </>
              )}
              
              {!isLoadingUser && !currentUser && (
                <Alert severity="warning">
                  無法獲取用戶資訊，請確認您已登入系統
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>取消</Button>
          {tabValue === 0 ? (
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSaving ? '保存中...' : '保存設定'}
            </Button>
          ) : (
            <Button
              onClick={handleSaveAccount}
              color="primary"
              variant="contained"
              disabled={isSaving ?? isLoadingUser ?? !currentUser}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSaving ? '保存中...' : '保存帳號設定'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsModal;