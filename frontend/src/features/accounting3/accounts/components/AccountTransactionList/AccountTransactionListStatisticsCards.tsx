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

interface AccountTransactionListStatisticsCardsProps {
  statistics: TransactionStatistics;
}

/**
 * 交易統計卡片組件
 * 顯示科目的交易統計資訊
 */
/**
 * 交易統計卡片組件 - 觸控平板優化版本
 * 顯示科目的交易統計資訊，針對觸控平板進行了優化
 */
export const AccountTransactionListStatisticsCards: React.FC<AccountTransactionListStatisticsCardsProps> = ({
  statistics
}) => {
  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 卡片共用樣式
  const cardStyle = {
    height: '100%',
    boxShadow: 2,
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      boxShadow: 4,
      transform: 'translateY(-2px)'
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: 1
    }
  };

  // 圖標共用樣式
  const iconStyle = {
    fontSize: { xs: 20, sm: 24 },
    mr: 1
  };

  return (
    <Grid container spacing={1} sx={{ mb: 2 }}>
      <Grid item xs={3} sm={3} md={3}>
        <Card sx={cardStyle}>
          <CardContent sx={{
            p: { xs: 1, sm: 2 },
            '&:last-child': { pb: { xs: 1, sm: 2 } },
            minHeight: { xs: 70, sm: 90 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <AssessmentIcon color="primary" sx={iconStyle} />
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                交易筆數
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {statistics.totalTransactions}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={3} sm={3} md={3}>
        <Card sx={cardStyle}>
          <CardContent sx={{
            p: { xs: 1, sm: 2 },
            '&:last-child': { pb: { xs: 1, sm: 2 } },
            minHeight: { xs: 70, sm: 90 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <TrendingUpIcon color="success" sx={iconStyle} />
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                借方總額
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {formatCurrency(statistics.totalDebitAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={3} sm={3} md={3}>
        <Card sx={cardStyle}>
          <CardContent sx={{
            p: { xs: 1, sm: 2 },
            '&:last-child': { pb: { xs: 1, sm: 2 } },
            minHeight: { xs: 70, sm: 90 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <TrendingDownIcon color="error" sx={iconStyle} />
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                貸方總額
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" color="error.main">
              {formatCurrency(statistics.totalCreditAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={3} sm={3} md={3}>
        <Card sx={cardStyle}>
          <CardContent sx={{
            p: { xs: 1, sm: 2 },
            '&:last-child': { pb: { xs: 1, sm: 2 } },
            minHeight: { xs: 70, sm: 90 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <AccountBalanceIcon color="info" sx={iconStyle} />
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
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

export default AccountTransactionListStatisticsCards;