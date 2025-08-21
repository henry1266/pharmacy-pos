import React, { FC } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import { formatCurrency } from '../utils/dashboardUtils';
import type { DailyStats } from '../hooks/useDailyStats';

/**
 * 摘要卡片屬性
 */
interface SummaryCardsProps {
  /** 日期統計數據 */
  dailyStats: DailyStats;
}

/**
 * 摘要卡片組件
 * 
 * @description 顯示交易摘要和營運指標的卡片組件
 * 
 * @component
 * @example
 * ```tsx
 * <SummaryCards dailyStats={dailyStats} />
 * ```
 */
const SummaryCards: FC<SummaryCardsProps> = ({ dailyStats }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              交易摘要
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>平均進貨金額：</Typography>
                <Typography fontWeight="medium">
                  {formatCurrency(dailyStats.purchaseCount > 0 ? dailyStats.purchaseTotal / dailyStats.purchaseCount : 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>平均出貨金額：</Typography>
                <Typography fontWeight="medium">
                  {formatCurrency(dailyStats.shippingCount > 0 ? dailyStats.shippingTotal / dailyStats.shippingCount : 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>進出貨差額：</Typography>
                <Typography fontWeight="medium" color={dailyStats.shippingTotal - dailyStats.purchaseTotal >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(dailyStats.shippingTotal - dailyStats.purchaseTotal)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              營運指標
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>總交易筆數：</Typography>
                <Typography fontWeight="medium">
                  {dailyStats.purchaseCount + dailyStats.shippingCount}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>進貨筆數：</Typography>
                <Typography fontWeight="medium">
                  {dailyStats.purchaseCount}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>出貨筆數：</Typography>
                <Typography fontWeight="medium">
                  {dailyStats.shippingCount}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>進出貨比率：</Typography>
                <Typography fontWeight="medium">
                  {(() => {
                    if (dailyStats.purchaseCount <= 0) return '0.00';
                    const ratio = dailyStats.shippingCount / dailyStats.purchaseCount;
                    return isFinite(ratio) ? ratio.toFixed(2) : '0.00';
                  })()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SummaryCards;