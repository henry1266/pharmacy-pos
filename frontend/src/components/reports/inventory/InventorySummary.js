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
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  AttachMoney, 
  TrendingUp, 
  Inventory as InventoryIcon,
  Timeline
} from '@mui/icons-material';
import Receipt from '@mui/icons-material/Receipt';
import LocalShipping from '@mui/icons-material/LocalShipping';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import axios from 'axios';

const InventorySummary = ({ filters }) => {
  const [summaryData, setSummaryData] = useState({
    totalItems: 0,
    totalInventoryValue: 0,
    totalGrossProfit: 0,
    totalProfitLoss: 0,
    orderLinks: []
  });
  const [transactionHistory, setTransactionHistory] = useState([]);
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

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 2 }}>
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
          {/* 插入 "-" 符號 */}
		<Grid item xs={12} sm={6} md={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<Typography variant="h4" fontWeight="700" color="text.secondary">
				+
			</Typography>
		</Grid>
        {/* 總毛利 */}
        <Grid item xs={12} sm={6} md={3}>
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
          {/* 插入 "-" 符號 */}
		<Grid item xs={12} sm={6} md={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<Typography variant="h4" fontWeight="700" color="text.secondary">
				=
			</Typography>
		</Grid>
        {/* 損益總和 */}
        <Grid item xs={12} sm={6} md={3}>
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
                    color={transactionHistory.length > 0 && transactionHistory[transactionHistory.length - 1]?.cumulativeProfitLoss >= 0 
                      ? 'success.main' 
                      : 'error.main'}
                  >
                    {transactionHistory.length > 0 
                      ? formatCurrency(transactionHistory[transactionHistory.length - 1]?.cumulativeProfitLoss || 0)
                      : formatCurrency(0)}
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
                  <Timeline />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventorySummary;
