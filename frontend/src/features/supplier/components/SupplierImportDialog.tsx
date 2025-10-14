import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { FileDownload as FileDownloadIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import { ImportResult } from '../types';

interface SupplierImportDialogProps {
  open: boolean;
  onClose: () => void;
  isTestMode: boolean;
  csvFile: File | null;
  importLoading: boolean;
  importResult: ImportResult | null;
  templateDownloading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onImport: () => void;
}

const SupplierImportDialog: React.FC<SupplierImportDialogProps> = ({
  open,
  onClose,
  isTestMode,
  csvFile,
  importLoading,
  importResult,
  templateDownloading,
  onFileChange,
  onDownloadTemplate,
  onImport
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>匯入供應商 CSV {isTestMode && "(模擬)"}</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Typography variant="body2" gutterBottom>
            請選擇要匯入的CSV文件。文件應包含以下欄位：{' '}
            <code>code</code>{' '}, {' '}<code>shortCode</code>, <code>name</code>{' '},
            <code>contactPerson</code>{' '}, {' '}<code>phone</code>{' '}, {' '}<code>taxId</code>{' '},
            <code>paymentTerms</code>{' '}, {' '}<code>notes</code>{' '}.
          </Typography>

          <Typography variant="body2" gutterBottom>
            <code>code</code>{' '}和{' '}<code>name</code>{' '}為必填欄位。
          </Typography>

          <Button
            component="label"
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={onDownloadTemplate}
            sx={{ mr: 2, mb: { xs: 1, sm: 0 } }}
            disabled={templateDownloading}
          >
            {templateDownloading ? '下載中...' : '下載CSV模板'}
          </Button>

          <input
            type="file"
            accept=".csv"
            onChange={onFileChange}
            style={{ display: 'none' }}
            id="csv-upload-input"
          />
          <label htmlFor="csv-upload-input">
            <Button component="span" variant="contained" startIcon={<UploadFileIcon />}>
              選擇文件
            </Button>
          </label>

          {csvFile && (
            <Typography sx={{ mt: 1 }}>
              已選擇: {csvFile.name}
            </Typography>
          )}
        </Box>

        {importLoading && <LinearProgress sx={{ my: 2 }} />}

        {importResult && (
          <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle1">匯入結果:</Typography>
            <Typography>總共處理: {importResult.total}</Typography>
            <Typography color="success.main">成功: {importResult.success}</Typography>
            <Typography color="error.main">失敗: {importResult.failed}</Typography>
            <Typography color="warning.main">重複: {importResult.duplicates}</Typography>

            {importResult.errors && importResult.errors.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="error.main">錯誤詳情:</Typography>
                <List dense disablePadding>
                  {importResult.errors.slice(0, 5).map((err, index) => (
                    <ListItem key={`error-${index}-${err.row ?? ''}-${err.error.substring(0, 10)}`} disableGutters sx={{ pl: 1 }}>
                      <ListItemText
                        primary={`行 ${err.row ?? '-'}: ${err.error}`}
                        sx={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  ))}
                  {importResult.errors.length > 5 && (
                    <ListItemText
                      primary={`...還有 ${importResult.errors.length - 5} 個錯誤`}
                      sx={{ fontSize: '0.8rem', pl: 1 }}
                    />
                  )}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>關閉</Button>
        <Button
          onClick={onImport}
          variant="contained"
          disabled={!csvFile || importLoading}
        >
          {importLoading ? '匯入中...' : '開始匯入'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierImportDialog;
