import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface TransactionStatistics {
  totalTransactions: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  netAmount: number;
  averageAmount: number;
  lastTransactionDate: Date | null;
}

interface TransactionStatisticsCardsProps {
  statistics: TransactionStatistics;
}

/**
 * 交易統計卡片組件
 * 顯示科目的交易統計資訊
 */
export const TransactionStatisticsCards: React.FC<TransactionStatisticsCardsProps> = ({
  statistics
}) => {
  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AssessmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                交易筆數
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {statistics.totalTransactions}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                借方總額
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {formatCurrency(statistics.totalDebitAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingDownIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                貸方總額
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" color="error.main">
              {formatCurrency(statistics.totalCreditAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccountBalanceIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                淨額
              </Typography>
            </Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              color={statistics.netAmount >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(statistics.netAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TransactionStatisticsCards;