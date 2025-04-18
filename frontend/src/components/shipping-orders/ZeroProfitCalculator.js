import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  CircularProgress,
  Box,
  Alert
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import axios from 'axios';

/**
 * 零毛利計算器組件
 * 當按鈕點擊時，若已選擇藥品及數量，則觸發FIFO模擬計算
 * 計算出此數量總成本該為多少才能維持毛利數字為0 (總收入=總成本)
 * 
 * @param {Object} props - 組件屬性
 * @param {Object} props.currentItem - 當前項目數據
 * @param {Function} props.onCalculated - 計算完成後的回調函數，接收計算出的零毛利總成本
 * @returns {React.ReactElement} 零毛利計算器組件
 */
const ZeroProfitCalculator = ({ currentItem, onCalculated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 開啟對話框
  const handleOpen = () => {
    // 檢查是否已選擇藥品及數量
    if (!currentItem.product || !currentItem.dquantity) {
      setError('請先選擇藥品並輸入數量');
      setOpen(true);
      return;
    }

    setOpen(true);
    setLoading(true);
    setError(null);
    calculateZeroProfit();
  };

  // 關閉對話框
  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setError(null);
  };

  // 應用計算結果
  const handleApply = () => {
    if (result && onCalculated) {
      onCalculated(result.zeroProfitCost);
    }
    handleClose();
  };

  // 計算零毛利總成本
  const calculateZeroProfit = async () => {
    try {
      // 調用後端API進行FIFO模擬計算
      const response = await axios.get(`/api/fifo/zero-profit/${currentItem.product}?quantity=${currentItem.dquantity}`);
      
      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || '計算失敗');
      }
    } catch (err) {
      console.error('零毛利計算失敗:', err);
      setError(err.response?.data?.message || '零毛利計算失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<CalculateIcon />}
        onClick={handleOpen}
        sx={{ ml: 1 }}
      >
        零毛利計算器
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>零毛利計算器</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          ) : result ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                計算結果
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Typography variant="body1">
                  藥品: <strong>{currentItem.dname}</strong>
                </Typography>
                <Typography variant="body1">
                  數量: <strong>{currentItem.dquantity}</strong>
                </Typography>
                <Typography variant="body1">
                  零毛利總成本: <strong>{result.zeroProfitCost.toFixed(2)}</strong>
                </Typography>
                <Typography variant="body1">
                  建議單價: <strong>{(result.zeroProfitCost / currentItem.dquantity).toFixed(2)}</strong>
                </Typography>
                {result.fifoDetails && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      FIFO成本計算明細:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ 
                      backgroundColor: '#f5f5f5', 
                      p: 1, 
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.875rem'
                    }}>
                      {JSON.stringify(result.fifoDetails, null, 2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Typography>正在準備計算...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            取消
          </Button>
          {result && (
            <Button onClick={handleApply} color="primary" variant="contained">
              應用結果
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ZeroProfitCalculator;
