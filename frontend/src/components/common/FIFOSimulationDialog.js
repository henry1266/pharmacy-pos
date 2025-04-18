import React from 'react';
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

/**
 * FIFO模擬結果對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 對話框是否開啟
 * @param {Function} props.onClose - 關閉對話框的回調函數
 * @param {Object} props.simulationResult - FIFO模擬結果
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤訊息
 * @param {Function} props.onApplyCost - 應用成本的回調函數
 * @returns {React.ReactElement} FIFO模擬結果對話框組件
 */
const FIFOSimulationDialog = ({
  open,
  onClose,
  simulationResult,
  loading,
  error,
  onApplyCost
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
            onClick={() => onApplyCost(simulationResult.totalCost)} 
            color="primary"
            variant="contained"
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
