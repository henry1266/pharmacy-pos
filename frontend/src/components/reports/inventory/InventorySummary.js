import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  AttachMoney, 
  TrendingUp, 
  Inventory as InventoryIcon,
  Warning
} from '@mui/icons-material';
import axios from 'axios';

const InventorySummary = ({ filters }) => {
  const [summaryData, setSummaryData] = useState({
    totalItems: 0,
    totalInventoryValue: 0,
    totalPotentialRevenue: 0,
    totalPotentialProfit: 0,
    lowStockCount: 0
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
        
        const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
        if (response.data && response.data.summary) {
          setSummaryData(response.data.summary);
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
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* 總庫存價值 */}
      <Grid item xs={12} sm={6} md={3}>
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
      
      {/* 潛在收入 */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  潛在收入
                </Typography>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {formatCurrency(summaryData.totalPotentialRevenue)}
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
      
      {/* 潛在利潤 */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  潛在利潤
                </Typography>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {formatCurrency(summaryData.totalPotentialProfit)}
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
      
      {/* 低庫存商品 */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  低庫存商品
                </Typography>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {summaryData.lowStockCount}
                </Typography>
              </Box>
              <Box sx={{ 
                backgroundColor: 'rgba(229, 63, 60, 0.1)', 
                color: 'var(--danger-color)',
                width: 40,
                height: 40,
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Warning />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default InventorySummary;
