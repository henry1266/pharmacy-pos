import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { syncMongoDBConfig } from '../utils/configSync.ts';

// 定義 Snackbar 狀態的介面
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

/**
 * IP 設定頁面組件
 * @returns {React.ReactElement} IP 設定頁面組件
 */
const SettingsIpPage: React.FC = () => {
  // 從localStorage獲取當前IP設定，如果沒有則使用默認值
  const [apiIpAddress, setApiIpAddress] = useState<string>('');
  const [mongodbIpAddress, setMongodbIpAddress] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 初始化時從localStorage讀取IP設定
  useEffect(() => {
    const savedApiIp = localStorage.getItem('apiServerIp');
    if (savedApiIp) {
      setApiIpAddress(savedApiIp);
    } else {
      // 默認值，從當前apiService配置中獲取
      setApiIpAddress(process.env.REACT_APP_DEFAULT_API_IP || '192.168.68.90'); // Use env var or fallback
    }

    const savedMongodbIp = localStorage.getItem('mongodbServerIp');
    if (savedMongodbIp) {
      setMongodbIpAddress(savedMongodbIp);
    } else {
      // 默認值，通常與API伺服器相同
      setMongodbIpAddress(process.env.REACT_APP_DEFAULT_MONGODB_IP || '192.168.68.90'); // Use env var or fallback
    }
  }, []);

  // 處理API IP地址輸入變更
  const handleApiIpChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setApiIpAddress(e.target.value);
  };

  // 處理MongoDB IP地址輸入變更
  const handleMongodbIpChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMongodbIpAddress(e.target.value);
  };

  // 處理保存設定
  const handleSave = async (): Promise<void> => {
    // 驗證IP地址格式
    const ipRegex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    
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

  // 處理關閉提示
  const handleCloseSnackbar = (): void => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          IP 位址設定
        </Typography>
        <Divider sx={{ my: 2 }} />
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button 
            onClick={handleSave} 
            color="primary" 
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSaving ? '保存中...' : '保存設定'}
          </Button>
        </Box>
      </Paper>

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
    </Container>
  );
};

export default SettingsIpPage;