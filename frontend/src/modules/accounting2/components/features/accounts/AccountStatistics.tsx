import React from 'react';
import {
  Box,
  Typography,
  Grid
} from '@mui/material';
import { formatCurrency } from '@utils/formatters';

// 統計資料介面
interface AccountStatistics {
  totalEntries: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

// 統計組件 Props 介面
interface AccountStatisticsProps {
  statistics: AccountStatistics;
}

/**
 * 科目統計摘要組件
 * 
 * 職責：
 * - 顯示科目統計資料
 * - 格式化數字顯示
 * - 提供視覺化的餘額狀態
 */
export const AccountStatistics: React.FC<AccountStatisticsProps> = ({
  statistics
}) => {
  return (
    <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              筆數
            </Typography>
            <Typography variant="h6" color="primary">
              {statistics.totalEntries}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              借方總額
            </Typography>
            <Typography 
              variant="h6" 
              color="success.main" 
              sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              {formatCurrency(statistics.totalDebit)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              貸方總額
            </Typography>
            <Typography 
              variant="h6" 
              color="error.main" 
              sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              {formatCurrency(statistics.totalCredit)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              餘額
            </Typography>
            <Typography
              variant="h6"
              color={statistics.balance >= 0 ? 'success.main' : 'error.main'}
              sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}
            >
              {formatCurrency(statistics.balance)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountStatistics;