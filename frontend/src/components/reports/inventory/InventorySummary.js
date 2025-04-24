import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Link
} from '@mui/material';
import { 
  AttachMoney, 
  TrendingUp, 
  Inventory as InventoryIcon,
  ReceiptIcon,
  LocalShippingIcon,
  ShoppingCartIcon
} from '@mui/icons-material';
import axios from 'axios';

const InventorySummary = ({ filters }) => {
  const [summaryData, setSummaryData] = useState({
    totalItems: 0,
    totalInventoryValue: 0,
    totalGrossProfit: 0,
    totalProfitLoss: 0,
    orderLinks: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 獲取庫存摘要數據
  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);
      try {
        // 構建查詢參數
        const params = new URLSearchParams();
        if (filters.supplier) params.append('supplier', filters.supplier);
        if (filters.category) params.append('category', filters.category);
        if (filters.productCode) params.append('productCode', filters.productCode);
        if (filters.productName) params.append('productName', filters.productName);
        if (filters.productType) params.append('productType', filters.productType);
        
        // 添加參數指示使用全部歷史計算
        params.append('useFullHistory', 'true');
        params.append('calculateFifoProfit', 'true');
        
        const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
        if (response.data && response.data.summary) {
          // 使用FIFO算法計算的總毛利和損益總和
          const { 
            totalInventoryValue, 
            totalRevenue, 
            totalCost, 
            totalProfit,
            orderLinks = []
          } = response.data.summary;
          
          setSummaryData({
            totalItems: response.data.summary.totalItems || 0,
            totalInventoryValue: totalInventoryValue || 0,
            totalGrossProfit: totalRevenue || 0,  // 總毛利 = 總收入
            totalProfitLoss: totalProfit || 0,    // 損益總和 = 總收入 - 總成本
            orderLinks: orderLinks || []
          });
        }
        setError(null);
      } catch (err) {
        console.error('獲取庫存摘要數據失敗:', err);
        setError('獲取庫存摘要數據失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [filters]);

  // 渲染訂單連結
  const renderOrderLinks = () => {
    if (!summaryData.orderLinks || summaryData.orderLinks.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          相關訂單:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {summaryData.orderLinks.map((link, index) => (
            <Link
              key={index}
              component={RouterLink}
              to={
                link.orderType === 'sale'
                  ? `/sales/${link.orderId}`
                  : link.orderType === 'shipping'
                  ? `/shipping-orders/${link.orderId}`
                  : link.orderType === 'purchase'
                  ? `/purchase-orders/${link.orderId}`
                  : '#'
              }
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none',
                mr: 1,
                mb: 1,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              {link.orderType === 'sale' && <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {link.orderType === 'shipping' && <LocalShippingIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {link.orderType === 'purchase' && <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {link.orderNumber}
            </Link>
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 2 }}>
        {/* 總庫存價值 */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    總庫存價值
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                    {formatCurrency(summaryData.totalInventoryValue)}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: 'var(--primary-light)', 
                  color: 'var(--primary-color)',
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AttachMoney />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 總毛利 */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    總毛利
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    fontWeight="600" 
                    color={summaryData.totalGrossProfit >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(summaryData.totalGrossProfit)}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: 'rgba(0, 217, 126, 0.1)', 
                  color: 'var(--success-color)',
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 損益總和 */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    損益總和
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    fontWeight="600" 
                    color={summaryData.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(summaryData.totalProfitLoss)}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: 'rgba(245, 166, 35, 0.1)', 
                  color: 'var(--warning-color)',
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 訂單連結區域 */}
      {renderOrderLinks()}
    </Box>
  );
};

export default InventorySummary;
