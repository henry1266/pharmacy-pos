import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

interface TransactionOverviewProps {
  averageTransactionAmount: number;
  lastTransactionDate: Date | null;
  firstTransactionDate: Date | null;
  monthlyTrendLength: number;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | null) => string;
}

/**
 * 交易概覽組件
 * 顯示交易的基本統計資訊
 */
export const TransactionOverview: React.FC<TransactionOverviewProps> = ({
  averageTransactionAmount,
  lastTransactionDate,
  firstTransactionDate,
  monthlyTrendLength,
  formatCurrency,
  formatDate
}) => {
  return (
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            交易概覽
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  平均交易金額
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(averageTransactionAmount)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  最後交易日期
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatDate(lastTransactionDate)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  首次交易日期
                </Typography>
                <Typography variant="body1">
                  {formatDate(firstTransactionDate)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  活躍月份
                </Typography>
                <Typography variant="body1">
                  {monthlyTrendLength} 個月
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default TransactionOverview;