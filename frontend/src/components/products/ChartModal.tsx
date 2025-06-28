import React, { FC, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
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

// 定義庫存記錄的型別
interface InventoryRecord {
  _id: string;
  quantity: number;
  totalAmount?: number;
  saleNumber?: string;
  purchaseOrderNumber?: string;
  shippingOrderNumber?: string;
  saleId?: string | { $oid: string } | any;
  purchaseOrderId?: string | { $oid: string } | any;
  shippingOrderId?: string | { $oid: string } | any;
  type?: 'sale' | 'purchase' | 'ship';
  totalQuantity?: number;
  currentStock?: number;
  product?: any;
}

interface ChartModalProps {
  open: boolean;
  onClose: () => void;
  chartData: ChartTransaction[];
  productName?: string;
  inventoryData?: InventoryRecord[];
  currentStock?: number;
  profitLoss?: number;
}

const ChartModal: FC<ChartModalProps> = ({
  open,
  onClose,
  chartData,
  productName,
  inventoryData = [],
  currentStock = 0,
  profitLoss = 0
}) => {
  // 狀態管理：選中的訂單號碼
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | undefined>(undefined);
  // 輔助函數：從MongoDB格式的對象ID中提取$oid值
  const extractOidFromMongoId = (mongoId: string | { $oid: string } | { _id: string | { $oid: string } } | undefined): string => {
    if (!mongoId) return '';
    
    if (typeof mongoId === 'object' && mongoId !== null && '$oid' in mongoId) {
      return mongoId.$oid;
    }
    
    if (typeof mongoId === 'object' && mongoId !== null && '_id' in mongoId) {
      if (typeof mongoId._id === 'object' && mongoId._id !== null && '$oid' in mongoId._id) {
        return mongoId._id.$oid;
      }
      if (typeof mongoId._id === 'string') {
        return mongoId._id;
      }
    }
    
    if (typeof mongoId === 'string') {
      return mongoId;
    }
    
    return '';
  };

  // 獲取類型顯示
  const getTypeDisplay = (type?: string) => {
    switch(type) {
      case 'sale':
        return { text: '銷售', color: 'error.main' };
      case 'purchase':
        return { text: '進貨', color: 'primary.main' };
      case 'ship':
        return { text: '出貨', color: 'error.main' };
      default:
        return { text: '其他', color: 'text.secondary' };
    }
  };

  // 獲取訂單資訊
  const getOrderInfo = (inv: InventoryRecord) => {
    let orderNumber = '';
    let orderLink = '';
    
    if (inv.type === 'sale') {
      orderNumber = inv.saleNumber ?? '';
      const saleId = extractOidFromMongoId(inv.saleId) || extractOidFromMongoId(inv._id) || '';
      orderLink = `/sales/${saleId}`;
    } else if (inv.type === 'purchase') {
      orderNumber = inv.purchaseOrderNumber ?? '';
      const purchaseId = extractOidFromMongoId(inv.purchaseOrderId) || extractOidFromMongoId(inv._id) || '';
      orderLink = `/purchase-orders/${purchaseId}`;
    } else if (inv.type === 'ship') {
      orderNumber = inv.shippingOrderNumber || '';
      const shippingId = extractOidFromMongoId(inv.shippingOrderId) || extractOidFromMongoId(inv._id) || '';
      orderLink = `/shipping-orders/${shippingId}`;
    }
    
    return { orderNumber, orderLink };
  };

  // 計算實際交易價格
  const calculatePrice = (inv: InventoryRecord): string => {
    if (inv.totalAmount && inv.totalQuantity) {
      const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
      return unitPrice.toFixed(2);
    } else if (inv.product?.sellingPrice) {
      return inv.product.sellingPrice.toFixed(2);
    } else if (inv.product?.price) {
      return inv.product.price.toFixed(2);
    }
    return '0.00';
  };

  // 根據庫存記錄獲取對應的訂單號碼
  const getOrderNumberFromInventory = (inventoryRecord: InventoryRecord): string | undefined => {
    const { orderNumber } = getOrderInfo(inventoryRecord);
    return orderNumber || undefined;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '95vh',
          width: '95vw'
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
        <Grid container spacing={3}>
          {/* 左側：圖表區域 */}
          <Grid item xs={12} md={6}>
            {/* 盈虧分析圖表 */}
            <Box sx={{ mb: 3 }}>
              <SingleProductProfitLossChart transactions={chartData} />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* 庫存變化圖表 */}
            <Box>
              <InventoryStockChart
                transactions={chartData}
                selectedOrderNumber={selectedOrderNumber}
              />
            </Box>
          </Grid>
          
          {/* 右側：庫存清單 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 'fit-content' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                庫存清單
              </Typography>
              
              {/* 庫存摘要資訊 */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">總庫存數量:</Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                    {currentStock}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">損益總和:</Typography>
                  <Typography
                    variant="body2"
                    color={profitLoss >= 0 ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 'bold' }}
                  >
                    ${profitLoss.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* 庫存記錄表格 */}
              <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>庫存</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>貨單號</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>類型</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>數量</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>單價</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>總價</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryData.map((inv, index) => {
                      const { orderNumber, orderLink } = getOrderInfo(inv);
                      const typeDisplay = getTypeDisplay(inv.type);
                      const quantity = inv.totalQuantity ?? 0;
                      const price = calculatePrice(inv);
                      const totalPrice = (inv.totalAmount ?? 0).toFixed(2);
                      
                      const idSuffix = inv._id ?? ('no-id-' + index);
                      const stableKey = `${inv.type}-${orderNumber}-${idSuffix}`;
                      
                      return (
                        <TableRow
                          key={stableKey}
                          hover
                          selected={getOrderNumberFromInventory(inv) === selectedOrderNumber}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              '& .MuiTableCell-root': {
                                backgroundColor: 'transparent'
                              }
                            },
                            '&.Mui-selected': {
                              backgroundColor: 'action.selected'
                            }
                          }}
                          onClick={() => {
                            // 獲取對應的訂單號碼
                            const orderNumber = getOrderNumberFromInventory(inv);
                            setSelectedOrderNumber(orderNumber);
                            console.log('Selected row:', inv, 'Order number:', orderNumber);
                          }}
                        >
                          <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                            {inv.currentStock}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                            <Link
                              component={RouterLink}
                              to={orderLink}
                              color={(inv.type === 'sale' || inv.type === 'ship') ? 'error' : 'primary'}
                              sx={{ textDecoration: 'none' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: typeDisplay.color,
                              fontWeight: 'medium',
                              fontSize: '0.75rem'
                            }}
                          >
                            {typeDisplay.text}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: typeDisplay.color,
                              fontWeight: 'medium',
                              fontSize: '0.75rem'
                            }}
                          >
                            {quantity}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                            {price}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                            ${totalPrice}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
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