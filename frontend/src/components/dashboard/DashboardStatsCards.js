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
  LocalPharmacy,
  People,
  Business,
  ShoppingCart
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, iconBgColor, iconColor }) => (
  <Card sx={{ 
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.3s',
    '&:hover': {
      boxShadow: 'var(--card-shadow-hover)'
    }
  }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ 
        backgroundColor: iconBgColor,
        color: iconColor,
        width: 48,
        height: 48,
        borderRadius: 'var(--border-radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 2
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
          {value || 0} {/* Ensure value is not null/undefined */}
        </Typography>
        <Typography color="var(--text-secondary)" fontSize="0.875rem">
          {title}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

// 添加 StatCard 的 PropTypes 驗證
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  icon: PropTypes.element.isRequired,
  iconBgColor: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired
};

const DashboardStatsCards = ({ countsData }) => {
  const counts = countsData || {};

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="藥品數量"
          value={counts.products}
          icon={<LocalPharmacy />}
          iconBgColor="var(--primary-light)"
          iconColor="var(--primary-color)"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="會員數量"
          value={counts.customers}
          icon={<People />}
          iconBgColor="rgba(0, 217, 126, 0.1)"
          iconColor="var(--success-color)"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="供應商數量"
          value={counts.suppliers}
          icon={<Business />}
          iconBgColor="rgba(245, 166, 35, 0.1)"
          iconColor="var(--warning-color)"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="訂單數量"
          value={counts.orders}
          icon={<ShoppingCart />}
          iconBgColor="rgba(57, 175, 209, 0.1)"
          iconColor="var(--info-color)"
        />
      </Grid>
    </Grid>
  );
};

// 添加 DashboardStatsCards 的 PropTypes 驗證
DashboardStatsCards.propTypes = {
  countsData: PropTypes.shape({
    products: PropTypes.number,
    customers: PropTypes.number,
    suppliers: PropTypes.number,
    orders: PropTypes.number
  }).isRequired
};

export default DashboardStatsCards;
