import React from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Tabs, 
  Tab, 
  Box, 
  Typography, 
  CircularProgress,
  Alert,
  Input
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

/**
 * CSV導入對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 是否顯示對話框
 * @param {Function} props.onClose - 關閉對話框的處理函數
 * @param {number} props.tabValue - 當前標籤頁索引
 * @param {Function} props.onTabChange - 標籤頁切換的處理函數
 * @param {File} props.csvFile - 選擇的CSV文件
 * @param {Function} props.onFileChange - 文件選擇變更的處理函數
 * @param {Function} props.onImport - 導入操作的處理函數
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤信息
 * @param {boolean} props.success - 是否導入成功
 * @returns {React.ReactElement} CSV導入對話框組件
 */
const CsvImportDialog = ({
  open,
  onClose,
  tabValue,
  onTabChange,
  csvFile,
  onFileChange,
  onImport,
  loading,
  error,
  success
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>CSV導入</DialogTitle>
      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="基本資訊" />
          <Tab label="藥品項目" />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {tabValue === 0 && (
            <Typography variant="body2" gutterBottom>
              導入出貨單基本資訊，包括出貨單號、發票號碼、發票日期、客戶等。
            </Typography>
          )}
          
          {tabValue === 1 && (
            <Typography variant="body2" gutterBottom>
              導入出貨單藥品項目，包括出貨單號、藥品代碼、數量、總金額等。
            </Typography>
          )}
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <Input
              type="file"
              inputProps={{ accept: '.csv' }}
              onChange={onFileChange}
              disabled={loading}
              sx={{ display: 'none' }}
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                選擇CSV文件
              </Button>
            </label>
            
            {csvFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                已選擇: {csvFile.name}
              </Typography>
            )}
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              CSV導入成功！
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={onImport}
          color="primary"
          disabled={!csvFile || loading || success}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? '導入中...' : '導入'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes 驗證
CsvImportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tabValue: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  csvFile: PropTypes.object,
  onFileChange: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  success: PropTypes.bool.isRequired
};

export default CsvImportDialog;
