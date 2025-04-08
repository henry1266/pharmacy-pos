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
  Alert
} from '@mui/material';

/**
 * 設定彈出窗口組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 是否顯示彈出窗口
 * @param {Function} props.onClose - 關閉彈出窗口的回調函數
 * @returns {React.ReactElement} 設定彈出窗口組件
 */
const SettingsModal = ({ open, onClose }) => {
  // 從localStorage獲取當前IP設定，如果沒有則使用默認值
  const [ipAddress, setIpAddress] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 初始化時從localStorage讀取IP設定
  useEffect(() => {
    const savedIp = localStorage.getItem('apiServerIp');
    if (savedIp) {
      setIpAddress(savedIp);
    } else {
      // 默認值，從當前apiService配置中獲取
      setIpAddress('192.168.68.90');
    }
  }, [open]);

  // 處理IP地址輸入變更
  const handleIpChange = (e) => {
    setIpAddress(e.target.value);
  };

  // 處理保存設定
  const handleSave = () => {
    // 驗證IP地址格式
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    if (!ipRegex.test(ipAddress)) {
      setSnackbar({
        open: true,
        message: 'IP地址格式不正確，請輸入有效的IP地址',
        severity: 'error'
      });
      return;
    }

    // 保存IP地址到localStorage
    localStorage.setItem('apiServerIp', ipAddress);
    
    // 顯示成功提示
    setSnackbar({
      open: true,
      message: 'IP設定已保存，請重新整理頁面以套用更改',
      severity: 'success'
    });
    
    // 關閉彈出窗口
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // 處理關閉提示
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>系統設定</DialogTitle>
        <DialogContent>
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
              value={ipAddress}
              onChange={handleIpChange}
              placeholder="例如：192.168.68.90"
              helperText="設定後需要重新整理頁面以套用更改"
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">取消</Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            保存設定
          </Button>
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
