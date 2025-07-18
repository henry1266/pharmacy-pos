import React, { useEffect, useRef } from 'react';
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
 * FIFO成本部分介面
 */
interface CostPart {
  batchTime: string;
  quantity: number;
  unit_price: number;
  orderNumber?: string;
  orderType?: string;
  orderId?: string | number;
}

/**
 * FIFO匹配介面
 */
interface FIFOMatch {
  costParts: CostPart[];
}

/**
 * FIFO模擬結果介面
 */
export interface SimulationResult {
  fifoMatches?: FIFOMatch[];
  productCode?: string;
  productName?: string;
  quantity?: number;
  totalCost: number;
  hasNegativeInventory?: boolean;
  availableQuantity?: number;
  remainingNegativeQuantity?: number;
}

/**
 * FIFO模擬結果對話框組件屬性
 */
interface FIFOSimulationDialogProps {
  open: boolean;
  onClose: () => void;
  simulationResult?: SimulationResult;
  loading: boolean;
  error?: string;
  onApplyCostAndAdd: (result: SimulationResult) => void;
}

/**
 * FIFO模擬結果對話框組件 (Refactored: Removed DOM manipulation)
 */
const FIFOSimulationDialog: React.FC<FIFOSimulationDialogProps> = ({
  open,
  onClose,
  simulationResult,
  loading,
  error,
  onApplyCostAndAdd // Renamed prop to reflect its action
}) => {
  // 創建一個ref用於應用此成本按鈕
  const applyCostButtonRef = useRef<HTMLButtonElement | null>(null);
  
  // 當對話框打開且有模擬結果時，自動聚焦到應用此成本按鈕
  useEffect(() => {
    if (open && simulationResult && !loading && !error && applyCostButtonRef.current) {
      // 短暫延遲確保DOM已完全渲染
      setTimeout(() => {
        if (applyCostButtonRef.current) {
          applyCostButtonRef.current.focus();
        }
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
              {simulationResult.remainingNegativeQuantity && simulationResult.remainingNegativeQuantity > 0 && (
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
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
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
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
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

export default FIFOSimulationDialog;