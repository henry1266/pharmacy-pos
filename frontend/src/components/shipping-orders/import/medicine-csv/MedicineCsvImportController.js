import React, { useState, useCallback, useEffect } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MedicineCsvImportDialog from './medicine-csv/MedicineCsvImportDialog';
import { parseMedicineCsvForPreview, importMedicineCsv } from '../../../services/medicineCsvService';

/**
 * 藥品CSV匯入控制器元件
 * 負責處理藥品CSV匯入的狀態管理與業務邏輯
 */
const MedicineCsvImportController = () => {
  const [open, setOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [orderNumber, setOrderNumber] = useState('');

  // 開啟對話框
  const handleOpen = () => {
    setOpen(true);
    resetState();
  };

  // 關閉對話框
  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  // 重置狀態
  const resetState = () => {
    setCsvFile(null);
    setLoading(false);
    setError('');
    setSuccess(false);
    setPreviewData([]);
    setOrderNumber('');
  };

  // 處理文件選擇變更
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setError('');
    setSuccess(false);
    
    try {
      // 解析CSV預覽
      const preview = await parseMedicineCsvForPreview(file);
      setPreviewData(preview);
    } catch (err) {
      setError(err.message || '無法解析CSV文件');
      setPreviewData([]);
    }
  }, []);

  // 處理導入操作
  const handleImport = useCallback(async () => {
    if (!csvFile) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await importMedicineCsv(csvFile);
      setSuccess(true);
      setOrderNumber(result.orderNumber || '');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || '導入失敗');
      setSuccess(false);
      setLoading(false);
    }
  }, [csvFile]);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          匯入藥品CSV
        </Button>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          格式: 日期,健保碼,數量,健保價 (自動產生出貨單號)
        </Typography>
      </Box>

      <MedicineCsvImportDialog
        open={open}
        onClose={handleClose}
        csvFile={csvFile}
        onFileChange={handleFileChange}
        onImport={handleImport}
        loading={loading}
        error={error}
        success={success}
        previewData={previewData}
      />

      {success && orderNumber && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          藥品CSV已成功匯入！出貨單號: {orderNumber}
        </Alert>
      )}
    </>
  );
};

export default MedicineCsvImportController;
