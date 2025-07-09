import React, { FC, useMemo, useState } from 'react';
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
  Link,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Inventory as InventoryIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
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
  // 選取狀態管理
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

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
  const calculatePrice = (inv: InventoryRecord): number => {
    // 檢查是否為「不扣庫存」產品
    const isExcludeFromStock = inv.product?.excludeFromStock === true;
    
    if (inv.totalAmount && inv.totalQuantity) {
      return inv.totalAmount / Math.abs(inv.totalQuantity);
    } else {
      // 根據交易類型選擇適當的價格
      if (inv.type === 'purchase') {
        // 進貨記錄：優先使用進貨價
        return inv.product?.purchasePrice ?? inv.product?.price ?? 0;
      } else if (inv.type === 'sale' || inv.type === 'ship') {
        // 銷售/出貨記錄：優先使用實際售價
        if (isExcludeFromStock && inv.type === 'sale') {
          // 「不扣庫存」產品的銷售：優先顯示實際售價
          if (inv.totalAmount && inv.totalQuantity) {
            return inv.totalAmount / Math.abs(inv.totalQuantity);
          }
          return inv.product?.sellingPrice ?? inv.product?.price ?? 0;
        }
        return inv.product?.sellingPrice ?? inv.product?.price ?? 0;
      } else {
        // 其他記錄：使用通用價格
        return inv.product?.price ?? 0;
      }
    }
  };

  // 準備 DataGrid 的行數據
  const rows = useMemo(() => {
    return inventoryData.map((inv, index) => {
      const { orderNumber, orderLink } = getOrderInfo(inv);
      const typeDisplay = getTypeDisplay(inv.type);
      const quantity = inv.totalQuantity ?? 0;
      const price = calculatePrice(inv);
      const totalPrice = inv.totalAmount ?? 0;
      
      const idSuffix = inv._id ?? ('no-id-' + index);
      const stableKey = `${inv.type}-${orderNumber}-${idSuffix}`;
      
      return {
        id: stableKey,
        currentStock: inv.currentStock ?? 0,
        orderNumber,
        orderLink,
        type: inv.type ?? '',
        typeDisplay: typeDisplay.text,
        typeColor: typeDisplay.color,
        quantity,
        price,
        totalAmount: totalPrice,
        isSelected: orderNumber === selectedOrderNumber
      };
    });
  }, [inventoryData, selectedOrderNumber]);

  // 定義 DataGrid 的欄位
  const columns: GridColDef[] = [
    {
      field: 'currentStock',
      headerName: '庫存',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: true
    },
    {
      field: 'orderNumber',
      headerName: '貨單號',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Link
          component={RouterLink}
          to={params.row.orderLink}
          color={(params.row.type === 'sale' || params.row.type === 'ship') ? 'error' : 'primary'}
          sx={{ textDecoration: 'none' }}
        >
          {params.value}
        </Link>
      )
    },
    {
      field: 'typeDisplay',
      headerName: '類型',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            color: params.row.typeColor,
            fontWeight: 'medium',
            fontSize: '0.875rem'
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'quantity',
      headerName: '數量',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            color: params.row.typeColor,
            fontWeight: 'medium',
            fontSize: '0.875rem'
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'price',
      headerName: '單價',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: true,
      valueFormatter: (params) => params.value.toFixed(2)
    },
    {
      field: 'totalAmount',
      headerName: '總價',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: true,
      valueFormatter: (params) => `$${params.value.toFixed(2)}`
    }
  ];

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
            <Box sx={{ mb: 2, width: '100%' }}>
              <SingleProductProfitLossChart
                transactions={chartData}
                selectedOrderNumber={selectedOrderNumber}
                onOrderSelect={setSelectedOrderNumber}
              />
            </Box>
            
            {/* 庫存變化圖表 */}
            <Box sx={{ width: '100%' }}>
              <InventoryStockChart
                transactions={chartData}
                selectedOrderNumber={selectedOrderNumber}
                onOrderSelect={setSelectedOrderNumber}
              />
            </Box>
          </Grid>
          
          {/* 右側：庫存清單 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 'fit-content' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                庫存清單
              </Typography>
              
              {/* 庫存摘要資訊 - Dashboard 風格 */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card
                      elevation={2}
                      sx={{
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <InventoryIcon color="primary" fontSize="medium" />
                          <Typography variant="subtitle1" color="text.secondary" fontWeight="medium" sx={{ ml: 1 }}>
                            總庫存數量
                          </Typography>
                        </Box>
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          color="primary.main"
                        >
                          {currentStock}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card
                      elevation={2}
                      sx={{
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MonetizationOnIcon
                            sx={{ color: profitLoss >= 0 ? '#00C853' : '#FF1744' }}
                            fontSize="medium"
                          />
                          <Typography variant="subtitle1" color="text.secondary" fontWeight="medium" sx={{ ml: 1 }}>
                            損益總和
                          </Typography>
                        </Box>
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          sx={{ color: profitLoss >= 0 ? '#00C853' : '#FF1744' }}
                        >
                          ${profitLoss.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* 庫存記錄 DataGrid */}
              <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={50}
                  rowsPerPageOptions={[25, 50, 100]}
                  disableSelectionOnClick
                  density="compact"
                  onRowClick={(params) => {
                    const orderNumber = params.row.orderNumber;
                    setSelectedOrderNumber(selectedOrderNumber === orderNumber ? null : orderNumber);
                  }}
                  sx={{
                    '& .MuiDataGrid-cell': {
                      fontSize: '0.95rem'
                    },
                    '& .MuiDataGrid-columnHeader': {
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    },
                    '& .MuiDataGrid-row': {
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    },
                    '& .MuiDataGrid-row.selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.main'
                      }
                    }
                  }}
                  getRowClassName={(params) =>
                    params.row.isSelected ? 'selected' : ''
                  }
                />
              </Box>
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