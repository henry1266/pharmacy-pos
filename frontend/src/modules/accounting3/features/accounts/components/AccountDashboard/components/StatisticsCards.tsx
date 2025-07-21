import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

interface StatisticsCardsProps {
  totalTransactions: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  netAmount: number;
  trendPercentage: number | null;
  formatCurrency: (amount: number) => string;
}

/**
 * 統計卡片組件
 * 顯示主要的統計數據：交易筆數、借方總額、貸方總額、淨額
 */
export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  totalTransactions,
  totalDebitAmount,
  totalCreditAmount,
  netAmount,
  trendPercentage,
  formatCurrency
}) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AssessmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                交易筆數
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {totalTransactions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              總交易數量
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                借方總額
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {formatCurrency(totalDebitAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              累計借方金額
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingDownIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                貸方總額
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" color="error.main">
              {formatCurrency(totalCreditAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              累計貸方金額
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccountBalanceIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                淨額
              </Typography>
              {trendPercentage !== null && (
                <Chip
                  label={`${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`}
                  size="small"
                  color={trendPercentage > 0 ? 'success' : 'error'}
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              color={netAmount >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(netAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              借方 - 貸方
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StatisticsCards;