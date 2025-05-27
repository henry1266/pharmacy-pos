import React from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

/**
 * CSV導入對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 對話框是否開啟
 * @param {Function} props.onClose - 關閉對話框的處理函數
 * @param {number} props.tabValue - 當前標籤頁索引
 * @param {Function} props.onTabChange - 標籤頁變更處理函數
 * @param {File} props.csvFile - 選擇的CSV文件
 * @param {Function} props.onFileChange - 文件變更處理函數
 * @param {Function} props.onImport - 導入處理函數
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
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>CSV匯入進貨單</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={onTabChange}>
            <Tab label="進貨單基本資訊" />
            <Tab label="進貨品項" />
          </Tabs>
        </Box>
        
        {tabValue === 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              匯入進貨單基本資訊
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              請上傳包含進貨單基本資訊的CSV文件。文件應包含以下欄位：進貨單號、發票號碼、發票日期、供應商、狀態、付款狀態等。
            </Typography>
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              匯入進貨品項
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              請上傳包含進貨品項的CSV文件。文件應包含以下欄位：進貨單號、藥品代碼、藥品名稱、數量、總成本等。
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
          >
            選擇CSV文件
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={onFileChange}
            />
          </Button>
          {csvFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              已選擇: {csvFile.name}
            </Typography>
          )}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            CSV導入成功！
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button 
          onClick={onImport} 
          variant="contained" 
          disabled={!csvFile || loading}
        >
          匯入
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
