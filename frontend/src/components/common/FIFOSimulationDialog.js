import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Box,
  CircularProgress,
  Alert,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';

/**
 * FIFO模擬結果對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 對話框是否開啟
 * @param {Function} props.onClose - 關閉對話框的回調函數
 * @param {Object} props.simulationResult - FIFO模擬結果
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤訊息
 * @param {Function} props.onApplyCost - 應用成本的回調函數
 * @param {Function} props.handleAddItem - 添加項目的回調函數
 * @returns {React.ReactElement} FIFO模擬結果對話框組件
 */
const FIFOSimulationDialog = ({
  open,
  onClose,
  simulationResult,
  loading,
  error,
  onApplyCost,
  handleAddItem
}) => {
  // 如果沒有模擬結果，顯示加載中或錯誤訊息
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!simulationResult) {
      return (
        <Typography variant="body1" sx={{ p: 2 }}>
          無模擬結果
        </Typography>
      );
    }

    // 獲取FIFO匹配結果
    const fifoMatch = simulationResult.fifoMatches && simulationResult.fifoMatches.length > 0 
      ? simulationResult.fifoMatches[0] 
      : null;

    // 如果沒有FIFO匹配結果，顯示提示訊息
    if (!fifoMatch) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          無法計算FIFO成本，可能是因為沒有足夠的庫存記錄。
        </Alert>
      );
    }

    return (
      <>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            FIFO模擬結果
          </Typography>
          <Typography variant="body1">
            產品: {simulationResult.productCode} - {simulationResult.productName}
          </Typography>
          <Typography variant="body1">
            數量: {simulationResult.quantity}
          </Typography>
          <Typography variant="body1" fontWeight="bold" color="primary">
            總成本: ${simulationResult.totalCost.toFixed(2)}
          </Typography>
          {simulationResult.hasNegativeInventory && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              庫存不足！可用庫存: {simulationResult.availableQuantity}，需要: {simulationResult.quantity}
              {simulationResult.remainingNegativeQuantity > 0 && (
                <Typography variant="body2">
                  缺少數量: {simulationResult.remainingNegativeQuantity}
                </Typography>
              )}
            </Alert>
          )}
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          FIFO成本分佈明細
        </Typography>
        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e9ecef' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>批次時間</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>數量</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>單價</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>小計</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fifoMatch.costParts.map((part, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {part.orderNumber ? (
                      <Link
                        component={RouterLink}
                        to={
                          part.orderType === 'purchase'
                            ? `/purchase-orders/${part.orderId}`
                            : '#'
                        }
                        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                      >
                        {part.orderType === 'purchase' && <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />}
                        {part.orderNumber}
                      </Link>
                    ) : (
                      new Date(part.batchTime).toLocaleDateString()
                    )}
                  </TableCell>
                  <TableCell align="right">{part.quantity}</TableCell>
                  <TableCell align="right">${part.unit_price.toFixed(2)}</TableCell>
                  <TableCell align="right">${(part.unit_price * part.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {/* 總計行 */}
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  總計:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  ${simulationResult.totalCost.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>FIFO成本模擬</DialogTitle>
      <DialogContent dividers>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        {simulationResult && !loading && !error && (
          <Button 
            onClick={() => {
              // 先關閉對話框，避免用戶重複點擊
              onClose();
              
              // 應用成本到輸入欄位
              onApplyCost(simulationResult.totalCost);
              
              // 使用setTimeout確保成本已被應用到輸入欄位
              setTimeout(() => {
                // 獲取總成本輸入欄位
                const dtotalCostInput = document.querySelector('input[name="dtotalCost"]');
                
                if (dtotalCostInput) {
                  console.log('模擬在總成本輸入欄位中按下Enter鍵', dtotalCostInput.value);
                  
                  // 創建一個模擬的鍵盤事件（Enter鍵）
                  const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                  });
                  
                  // 在總成本輸入欄位上觸發Enter鍵事件
                  dtotalCostInput.dispatchEvent(enterEvent);
                } else {
                  console.error('找不到總成本輸入欄位');
                }
              }, 300);
            }} 
            color="primary"
            variant="contained"
            startIcon={<AddIcon />}
          >
            應用此成本
          </Button>
        )}
        <Button onClick={onClose} color="secondary">
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FIFOSimulationDialog;
