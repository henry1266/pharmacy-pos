import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Paper,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';

interface MonthlyTrendData {
  month: string;
  debitAmount: number;
  creditAmount: number;
  netAmount: number;
  transactionCount: number;
}

interface MonthlyTrendProps {
  monthlyTrend: MonthlyTrendData[];
  formatCurrency: (amount: number) => string;
}

/**
 * 月度趨勢組件
 * 顯示最近6個月的交易趨勢
 */
export const MonthlyTrend: React.FC<MonthlyTrendProps> = ({
  monthlyTrend,
  formatCurrency
}) => {
  if (monthlyTrend.length === 0) {
    return null;
  }

  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon />
            月度趨勢
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ overflowX: 'auto' }}>
            <Grid container spacing={1} sx={{ minWidth: 600 }}>
              {monthlyTrend.slice(-6).map((monthData, index) => (
                <Grid item xs={2} key={monthData.month}>
                  <Paper sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {monthData.month}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {monthData.transactionCount} 筆
                    </Typography>
                    <Typography
                      variant="body2"
                      color={monthData.netAmount >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(monthData.netAmount)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default MonthlyTrend;