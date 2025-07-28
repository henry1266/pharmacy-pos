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
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';
import SingleProductProfitLossChart from '../reports/inventory/SingleProductProfitLossChart';
import InventoryStockChart from './InventoryStockChart';
import { convertToPackageDisplay } from '../package-units/utils';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';

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
  batchNumber?: string; // 批號欄位
}


interface ChartModalProps {
  open: boolean;
  onClose: () => void;
  chartData: ChartTransaction[];
  productName?: string;
  inventoryData?: InventoryRecord[];
  currentStock?: number;
  profitLoss?: number;
  packageUnits?: ProductPackageUnit[];
  productUnit?: string;
}

const ChartModal: FC<ChartModalProps> = ({
  open,
  onClose,
  chartData,
  productName,
  inventoryData = [],
  currentStock = 0,
  profitLoss: _profitLoss = 0,
  packageUnits = [],
  productUnit
}) => {
  // 選取狀態管理
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  
  // 篩選狀態管理
  const [filterType, setFilterType] = useState<'purchase' | 'ship' | 'sale' | null>(null);
  
  const handleCardClick = (cardId: string) => {
    // 根據卡片類型設置篩選
    if (cardId.includes('purchase')) {
      setFilterType(filterType === 'purchase' ? null : 'purchase');
    } else if (cardId.includes('ship')) {
      setFilterType(filterType === 'ship' ? null : 'ship');
    } else if (cardId.includes('sale')) {
      setFilterType(filterType === 'sale' ? null : 'sale');
    }
  };

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

  // 計算各類型的數量和金額統計
  const inventoryStats = useMemo(() => {
    let purchaseQuantity = 0;
    let shipQuantity = 0;
    let saleQuantity = 0;
    let purchaseAmount = 0;
    let shipAmount = 0;
    let saleAmount = 0;
    let calculatedProfitLoss = 0;

    inventoryData.forEach((inv) => {
      const quantity = Math.abs(inv.totalQuantity ?? 0);
      
      // 統計數量
      switch (inv.type) {
        case 'purchase':
          purchaseQuantity += quantity;
          break;
        case 'ship':
          shipQuantity += quantity;
          break;
        case 'sale':
          saleQuantity += quantity;
          break;
      }
      
      // 計算實際交易價格
      let price = 0;
      if (inv.totalAmount && inv.totalQuantity) {
        price = inv.totalAmount / Math.abs(inv.totalQuantity);
      } else {
        if (inv.type === 'purchase') {
          price = inv.product?.purchasePrice ?? inv.product?.price ?? 0;
        } else if (inv.type === 'sale' || inv.type === 'ship') {
          price = inv.product?.sellingPrice ?? inv.product?.price ?? 0;
        } else {
          price = inv.product?.price ?? 0;
        }
      }

      const amount = price * quantity;

      // 統計金額
      switch (inv.type) {
        case 'purchase':
          purchaseAmount += amount;
          break;
        case 'ship':
          shipAmount += amount;
          break;
        case 'sale':
          saleAmount += amount;
          break;
      }

      // 計算損益 - 複製 InventoryList.tsx 的邏輯
      const isExcludeFromStock = inv.product?.excludeFromStock === true;

      // 計算該記錄的損益
      if (inv.type === 'sale' && isExcludeFromStock) {
        // 「不扣庫存」產品的銷售：使用毛利計算
        let actualSellingPrice = 0;
        if (inv.totalAmount && inv.totalQuantity) {
          actualSellingPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
        } else {
          actualSellingPrice = inv.product?.sellingPrice ?? inv.product?.price ?? 0;
        }
        
        const setCostPrice = inv.product?.cost ?? inv.product?.purchasePrice ?? 0;
        const simpleProfit = quantity * (actualSellingPrice - setCostPrice);
        calculatedProfitLoss += simpleProfit;
      } else {
        // 正常損益計算
        const recordCost = price * quantity;
        
        if (inv.type === 'sale') {
          calculatedProfitLoss += recordCost; // 銷售增加損益
        } else if (inv.type === 'purchase') {
          calculatedProfitLoss -= recordCost; // 進貨減少損益
        } else if (inv.type === 'ship') {
          calculatedProfitLoss += recordCost; // 出貨增加損益
        }
      }
    });

    return {
      purchaseQuantity,
      shipQuantity,
      saleQuantity,
      purchaseAmount,
      shipAmount,
      saleAmount,
      profitLoss: calculatedProfitLoss
    };
  }, [inventoryData]);

  // 準備 DataGrid 的行數據
  const rows = useMemo(() => {
    // 先根據篩選條件過濾數據
    const filteredData = filterType
      ? inventoryData.filter(inv => inv.type === filterType)
      : inventoryData;
    
    return filteredData.map((inv, index) => {
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
        batchNumber: inv.batchNumber || '-', // 批號欄位
        isSelected: orderNumber === selectedOrderNumber
      };
    });
  }, [inventoryData, selectedOrderNumber, filterType]);

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
    },
    {
      field: 'batchNumber',
      headerName: '批號',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: params.value === '-' ? 'text.disabled' : 'text.primary'
          }}
        >
          {params.value}
        </Typography>
      )
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
          
          {/* 右側 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 'fit-content' }}>
              {/* 庫存計算公式 - 八個等大格子 */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  {/* 第一行 */}
                  {/* 總庫存 */}
                  <Grid item xs={3}>
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            庫存詳細資訊
                          </Typography>
                          <Typography variant="body2">
                            總數量：{currentStock} {productUnit || '個'}
                          </Typography>
                          {packageUnits && packageUnits.length > 0 && currentStock > 0 && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              包裝格式：{(() => {
                                const displayResult = convertToPackageDisplay(currentStock, packageUnits, productUnit || '個');
                                return displayResult.displayText;
                              })()}
                            </Typography>
                          )}
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Card
                        elevation={3}
                        sx={{
                          height: 90,
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          bgcolor: 'primary.light',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 6
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                            📦總庫存
                          </Typography>
                          <Typography variant="h5" color="primary.main" fontWeight="bold">
                            {packageUnits && packageUnits.length > 0 && currentStock > 0 ? (
                              (() => {
                                const displayResult = convertToPackageDisplay(currentStock, packageUnits, productUnit || '個');
                                return displayResult.displayText;
                              })()
                            ) : (
                              `${currentStock} ${productUnit || '個'}`
                            )}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Tooltip>
                  </Grid>

                  {/* 進貨數量 */}
                  <Grid item xs={3}>
                    <Card
                      elevation={3}
                      onClick={() => handleCardClick('purchaseQuantity')}
                      sx={{
                        height: 90,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: 'success.main',
                        bgcolor: filterType === 'purchase' ? 'success.light' : 'transparent',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          進貨數量
                        </Typography>
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                          {inventoryStats.purchaseQuantity}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 出貨數量 */}
                  <Grid item xs={3}>
                    <Card
                      elevation={3}
                      onClick={() => handleCardClick('shipQuantity')}
                      sx={{
                        height: 90,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: 'warning.main',
                        bgcolor: filterType === 'ship' ? 'warning.light' : 'transparent',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          出貨數量
                        </Typography>
                        <Typography variant="h5" color="warning.main" fontWeight="bold">
                          {inventoryStats.shipQuantity}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 銷售數量 */}
                  <Grid item xs={3}>
                    <Card
                      elevation={3}
                      onClick={() => handleCardClick('saleQuantity')}
                      sx={{
                        height: 90,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: 'error.main',
                        bgcolor: filterType === 'sale' ? 'error.light' : 'transparent',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          銷售數量
                        </Typography>
                        <Typography variant="h5" color="error.main" fontWeight="bold">
                          {inventoryStats.saleQuantity}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 第二行 */}
                  {/* 損益總和 */}
                  <Grid item xs={3}>
                    <Card
                      elevation={4}
                      sx={{
                        height: 90,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: inventoryStats.profitLoss >= 0 ? 'success.main' : 'error.main',
                        bgcolor: inventoryStats.profitLoss >= 0 ? 'success.light' : 'error.light',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 8
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          💰損益總和
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{ color: inventoryStats.profitLoss >= 0 ? 'success.main' : 'error.main' }}
                        >
                          ${inventoryStats.profitLoss.toFixed(0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 進貨金額 */}
                  <Grid item xs={3}>
                    <Card
                      elevation={3}
                      onClick={() => handleCardClick('purchaseAmount')}
                      sx={{
                        height: 90,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: 'success.main',
                        bgcolor: filterType === 'purchase' ? 'success.light' : 'transparent',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          進貨金額
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          ${inventoryStats.purchaseAmount.toFixed(0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 出貨金額 */}
                  <Grid item xs={3}>
                    <Card
                      elevation={3}
                      onClick={() => handleCardClick('shipAmount')}
                      sx={{
                        height: 90,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: 'warning.main',
                        bgcolor: filterType === 'ship' ? 'warning.light' : 'transparent',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          出貨金額
                        </Typography>
                        <Typography variant="h6" color="warning.main" fontWeight="bold">
                          ${inventoryStats.shipAmount.toFixed(0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 銷售金額 */}
                  <Grid item xs={3}>
                    <Card
                      elevation={3}
                      onClick={() => handleCardClick('saleAmount')}
                      sx={{
                        height: 90,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: 'error.main',
                        bgcolor: filterType === 'sale' ? 'error.light' : 'transparent',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                          銷售金額
                        </Typography>
                        <Typography variant="h6" color="error.main" fontWeight="bold">
                          ${inventoryStats.saleAmount.toFixed(0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* 篩選狀態顯示 */}
              {filterType && (
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    目前篩選：
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: filterType === 'purchase' ? 'success.light' :
                               filterType === 'ship' ? 'warning.light' : 'error.light',
                      color: filterType === 'purchase' ? 'success.main' :
                             filterType === 'ship' ? 'warning.main' : 'error.main',
                      fontWeight: 'medium'
                    }}
                  >
                    {filterType === 'purchase' ? '進貨' :
                     filterType === 'ship' ? '出貨' : '銷售'}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setFilterType(null);
                    }}
                    sx={{ ml: 1 }}
                  >
                    清除篩選
                  </Button>
                </Box>
              )}
              
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