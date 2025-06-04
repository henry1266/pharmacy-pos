import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
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
  CircularProgress
} from '@mui/material';
import { syncMongoDBConfig } from '../../utils/configSync';

/**
 * 設定彈出窗口組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 是否顯示彈出窗口
 * @param {Function} props.onClose - 關閉彈出窗口的回調函數
 * @returns {React.ReactElement} 設定彈出窗口組件
 */
const SettingsModal = ({ open, onClose }) => {
  // 從localStorage獲取當前IP設定，如果沒有則使用默認值
  const [apiIpAddress, setApiIpAddress] = useState('');
  const [mongodbIpAddress, setMongodbIpAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
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
  }, [open]);

  // 處理API IP地址輸入變更
  const handleApiIpChange = (e) => {
    setApiIpAddress(e.target.value);
  };

  // 處理MongoDB IP地址輸入變更
  const handleMongodbIpChange = (e) => {
    setMongodbIpAddress(e.target.value);
  };

  // 處理保存設定
  const handleSave = async () => {
    // 驗證IP地址格式 - 使用 \d 替代 [0-9]
    const ipRegex = /^(?:(?:2(?:[0-4]\d|5[0-5])|1\d{2}|\d{1,2})\.){3}(?:2(?:[0-4]\d|5[0-5])|1\d{2}|\d{1,2})$/;
    
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
    } catch (error) {
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>取消</Button>
          <Button 
            onClick={handleSave} 
            color="primary" 
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSaving ? '保存中...' : '保存設定'}
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

// 添加 SettingsModal 的 PropTypes 驗證
SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SettingsModal;
