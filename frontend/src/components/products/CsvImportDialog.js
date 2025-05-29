import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const CsvImportDialog = ({
  open,
  onClose,
  tabValue,
  csvFile,
  csvImportLoading,
  csvImportError,
  csvImportSuccess,
  handleCsvFileChange,
  handleCsvImport
}) => {
  // 處理顯示的提示訊息
  const renderAlert = () => {
    if (csvImportSuccess) {
      return (
        <Alert severity="success" sx={{ mb: 2 }}>
          匯入成功！
        </Alert>
      );
    }
    
    if (csvImportError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {csvImportError}
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={open} onClose={() => !csvImportLoading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>
        CSV匯入{tabValue === 0 ? '商品' : '藥品'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {renderAlert()}
          
          <Typography variant="body2" gutterBottom>
            請選擇CSV文件進行匯入。CSV文件應包含以下欄位：
          </Typography>
          
          <Typography variant="body2" component="div" sx={{ mb: 2 }}>
            {tabValue === 0 ? (
              <ul>
                <li>code (選填) - 商品編號，留空系統自動生成</li>
                <li>shortCode (必填) - 簡碼</li>
                <li>name (必填) - 商品名稱</li>
                <li>barcode (選填) - 國際條碼</li>
                <li>category (選填) - 分類</li>
                <li>unit (選填) - 單位</li>
                <li>purchasePrice (選填) - 進貨價</li>
                <li>sellingPrice (選填) - 售價</li>
                <li>minStock (選填) - 最低庫存</li>
                <li>description (選填) - 描述</li>
              </ul>
            ) : (
              <ul>
                <li>code (選填) - 藥品編號，留空系統自動生成</li>
                <li>shortCode (必填) - 簡碼</li>
                <li>name (必填) - 藥品名稱</li>
                <li>healthInsuranceCode (選填) - 健保碼</li>
                <li>healthInsurancePrice (選填) - 健保價</li>
                <li>category (選填) - 分類</li>
                <li>unit (選填) - 單位</li>
                <li>purchasePrice (選填) - 進貨價</li>
                <li>sellingPrice (選填) - 售價</li>
                <li>minStock (選填) - 最低庫存</li>
                <li>description (選填) - 描述</li>
              </ul>
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          <Button
  variant="outlined"
  component="label"
  startIcon={<CloudUploadIcon />}
  disabled={csvImportLoading}
>
  選擇CSV文件
  <input type="file" accept=".csv" hidden onChange={handleCsvFileChange}/>
</Button>
            {csvFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                已選擇: {csvFile.name}
              </Typography>
            )}
            
            {csvImportLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2">
                  正在匯入...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={csvImportLoading}
        >
          取消
        </Button>
        <Button 
          onClick={handleCsvImport} 
          color="primary" 
          variant="contained"
          disabled={!csvFile || csvImportLoading}
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
  csvFile: PropTypes.object,
  csvImportLoading: PropTypes.bool.isRequired,
  csvImportError: PropTypes.string,
  csvImportSuccess: PropTypes.bool.isRequired,
  handleCsvFileChange: PropTypes.func.isRequired,
  handleCsvImport: PropTypes.func.isRequired
};

export default CsvImportDialog;
