import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  Alert,
  Input,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

/**
 * 藥品CSV導入對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 是否顯示對話框
 * @param {Function} props.onClose - 關閉對話框的處理函數
 * @param {File} props.csvFile - 選擇的CSV文件
 * @param {Function} props.onFileChange - 文件選擇變更的處理函數
 * @param {Function} props.onImport - 導入操作的處理函數
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤信息
 * @param {boolean} props.success - 是否導入成功
 * @param {Array} props.previewData - 預覽數據
 * @returns {React.ReactElement} 藥品CSV導入對話框組件
 */
const MedicineCsvImportDialog = ({
  open,
  onClose,
  csvFile,
  onFileChange,
  onImport,
  loading,
  error,
  success,
  previewData = []
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>藥品CSV導入 (自動產生出貨單號)</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            導入藥品出貨單項目，CSV格式為：日期,健保碼,數量,健保價
          </Typography>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <Input
              type="file"
              inputProps={{ accept: '.csv' }}
              onChange={onFileChange}
              disabled={loading}
              sx={{ display: 'none' }}
              id="medicine-csv-file-input"
            />
            <label htmlFor="medicine-csv-file-input">
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
          
          {previewData.length > 0 && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                數據預覽 (前5筆)
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>日期</TableCell>
                      <TableCell>健保碼</TableCell>
                      <TableCell align="right">數量</TableCell>
                      <TableCell align="right">健保價</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.nhCode}</TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell align="right">{row.nhPrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                供應商將預設為：調劑 (SS)
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                出貨單號將自動產生
              </Typography>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              藥品CSV導入成功！
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

export default MedicineCsvImportDialog;
