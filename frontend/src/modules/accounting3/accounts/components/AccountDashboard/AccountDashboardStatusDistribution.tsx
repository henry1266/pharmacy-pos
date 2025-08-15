import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
} from '@mui/icons-material';

interface AccountDashboardStatusDistributionProps {
  statusDistribution: {
    draft: number;
    confirmed: number;
    cancelled: number;
  };
  totalTransactions: number;
}

/**
 * 狀態分佈組件
 * 顯示交易狀態的分佈情況
 */
export const AccountDashboardStatusDistribution: React.FC<AccountDashboardStatusDistributionProps> = ({
  statusDistribution,
  totalTransactions
}) => {
  return (
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon />
            交易狀態分佈
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">已確認</Typography>
              <Typography variant="body2" fontWeight="bold">
                {statusDistribution.confirmed}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalTransactions > 0 ? (statusDistribution.confirmed / totalTransactions) * 100 : 0}
              color="success"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">草稿</Typography>
              <Typography variant="body2" fontWeight="bold">
                {statusDistribution.draft}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalTransactions > 0 ? (statusDistribution.draft / totalTransactions) * 100 : 0}
              color="warning"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">已取消</Typography>
              <Typography variant="body2" fontWeight="bold">
                {statusDistribution.cancelled}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalTransactions > 0 ? (statusDistribution.cancelled / totalTransactions) * 100 : 0}
              color="error"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default AccountDashboardStatusDistribution;