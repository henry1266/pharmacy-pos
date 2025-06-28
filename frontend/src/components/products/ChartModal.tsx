import React, { FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import SingleProductProfitLossChart from '../reports/inventory/SingleProductProfitLossChart';
import InventoryStockChart from './InventoryStockChart';

// 定義交易記錄的型別
interface ChartTransaction {
  purchaseOrderNumber: string;
  shippingOrderNumber: string;
  saleNumber: string;
  type: string;
  quantity: number;
  price: number;
  cumulativeStock: number;
  cumulativeProfitLoss: number;
}

interface ChartModalProps {
  open: boolean;
  onClose: () => void;
  chartData: ChartTransaction[];
  productName?: string;
}

const ChartModal: FC<ChartModalProps> = ({ open, onClose, chartData, productName }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '95vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="div">
          {productName ? `${productName} - 圖表分析` : '圖表分析'}
        </Typography>
        <IconButton
          aria-label="關閉"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 2 }}>
        {/* 盈虧分析圖表 */}
        <Box sx={{ mb: 3 }}>
          <SingleProductProfitLossChart transactions={chartData} />
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* 庫存變化圖表 */}
        <Box>
          <InventoryStockChart transactions={chartData} />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChartModal;