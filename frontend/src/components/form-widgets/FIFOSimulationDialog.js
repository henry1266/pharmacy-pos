import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes
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
 * FIFO模擬結果對話框組件 (Refactored: Removed DOM manipulation)
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 對話框是否開啟
 * @param {Function} props.onClose - 關閉對話框的回調函數
 * @param {Object} props.simulationResult - FIFO模擬結果
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤訊息
 * @param {Function} props.onApplyCostAndAdd - 應用成本並觸發添加項目的回調函數 (Receives simulationResult)
 * @returns {React.ReactElement} FIFO模擬結果對話框組件
 */
const FIFOSimulationDialog = ({
  open,
  onClose,
  simulationResult,
  loading,
  error,
  onApplyCostAndAdd // Renamed prop to reflect its action
}) => {
  // 創建一個ref用於應用此成本按鈕
  const applyCostButtonRef = useRef(null);
  
  // 當對話框打開且有模擬結果時，自動聚焦到應用此成本按鈕
  useEffect(() => {
    if (open && simulationResult && !loading && !error && applyCostButtonRef.current) {
      // 短暫延遲確保DOM已完全渲染
      setTimeout(() => {
        applyCostButtonRef.current.focus();
      }, 100);
    }
  }, [open, simulationResult, loading, error]);

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
                <TableRow key={`fifo-part-${part.batchTime}-${index}`}>
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

  // 處理應用成本按鈕點擊 (Refactored: Removed DOM manipulation)
  const handleApplyCostClick = () => {
    if (simulationResult && onApplyCostAndAdd) {
      onApplyCostAndAdd(simulationResult); // Pass the result back to parent
    }
    onClose(); // Close the dialog regardless
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
            ref={applyCostButtonRef}
            onClick={handleApplyCostClick} // Use the refactored handler
            color="primary"
            variant="contained"
            startIcon={<AddIcon />}
          >
            應用此成本並添加
          </Button>
        )}
        <Button onClick={onClose} color="secondary">
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 添加 PropTypes 驗證
FIFOSimulationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  simulationResult: PropTypes.shape({
    fifoMatches: PropTypes.arrayOf(
      PropTypes.shape({
        costParts: PropTypes.arrayOf(
          PropTypes.shape({
            batchTime: PropTypes.string,
            quantity: PropTypes.number,
            unit_price: PropTypes.number,
            orderNumber: PropTypes.string,
            orderType: PropTypes.string,
            orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          })
        )
      })
    ),
    productCode: PropTypes.string,
    productName: PropTypes.string,
    quantity: PropTypes.number,
    totalCost: PropTypes.number,
    hasNegativeInventory: PropTypes.bool,
    availableQuantity: PropTypes.number,
    remainingNegativeQuantity: PropTypes.number
  }),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onApplyCostAndAdd: PropTypes.func.isRequired
};

export default FIFOSimulationDialog;
