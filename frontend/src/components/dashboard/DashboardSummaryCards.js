import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart
} from '@mui/icons-material';

// Helper function to format currency (can be moved to a utils file later)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount || 0); // Ensure amount is not null/undefined
};

const SummaryCard = ({ title, value, trend, trendText, icon, iconBgColor, iconColor }) => (
  <Card sx={{ 
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.3s',
    '&:hover': {
      boxShadow: 'var(--card-shadow-hover)'
    }
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {trend === 'up' ? 
                <TrendingUp sx={{ color: 'var(--success-color)', fontSize: '0.875rem', mr: 0.5 }} /> : 
                <TrendingDown sx={{ color: 'var(--danger-color)', fontSize: '0.875rem', mr: 0.5 }} />
              }
              <Typography variant="body2" color={trend === 'up' ? 'var(--success-color)' : 'var(--danger-color)'} fontSize="0.75rem" fontWeight="500">
                {trendText?.percentage || ''} 
              </Typography>
              <Typography variant="body2" color="var(--text-secondary)" fontSize="0.75rem" ml={0.5}>
                {trendText?.period || ''}
              </Typography>
            </Box>
          )} 
          {!trend && trendText?.period && (
             <Typography variant="body2" color="var(--text-secondary)" fontSize="0.75rem" mt={1}>
                {trendText.period}
              </Typography>
          )}
        </Box>
        <Box sx={{ 
          backgroundColor: iconBgColor,
          color: iconColor,
          width: 40,
          height: 40,
          borderRadius: 'var(--border-radius)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.oneOf(['up', 'down']),
  trendText: PropTypes.shape({
    percentage: PropTypes.string,
    period: PropTypes.string
  }),
  icon: PropTypes.node,
  iconBgColor: PropTypes.string,
  iconColor: PropTypes.string
};

const DashboardSummaryCards = ({ summaryData }) => {
  const salesSummary = summaryData?.salesSummary || {};
  const orderCount = summaryData?.counts?.orders || 0;

  // Dummy trend data - replace with actual data if available
  const todayTrend = { percentage: '+2.5%', period: '較昨日' };
  const monthTrend = { percentage: '+4.2%', period: '較上月' };
  const orderTrend = { percentage: '-1.8%', period: '較上週' };

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard 
          title="總銷售額"
          value={formatCurrency(salesSummary.total)}
          trendText={{ period: '所有時間' }}
          icon={<AttachMoney />}
          iconBgColor="var(--primary-light)"
          iconColor="var(--primary-color)"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard 
          title="今日銷售額"
          value={formatCurrency(salesSummary.today)}
          trend="up" // Dummy trend direction
          trendText={todayTrend}
          icon={<TrendingUp />}
          iconBgColor="rgba(0, 217, 126, 0.1)"
          iconColor="var(--success-color)"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard 
          title="本月銷售額"
          value={formatCurrency(salesSummary.month)}
          trend="up" // Dummy trend direction
          trendText={monthTrend}
          icon={<AttachMoney />}
          iconBgColor="rgba(245, 166, 35, 0.1)"
          iconColor="var(--warning-color)"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard 
          title="訂單數量"
          value={orderCount}
          trend="down" // Dummy trend direction
          trendText={orderTrend}
          icon={<ShoppingCart />}
          iconBgColor="rgba(57, 175, 209, 0.1)"
          iconColor="var(--info-color)"
        />
      </Grid>
    </Grid>
  );
};

DashboardSummaryCards.propTypes = {
  summaryData: PropTypes.shape({
    salesSummary: PropTypes.shape({
      total: PropTypes.number,
      today: PropTypes.number,
      month: PropTypes.number
    }),
    counts: PropTypes.shape({
      orders: PropTypes.number
    })
  })
};

export default DashboardSummaryCards;

