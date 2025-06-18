import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

/**
 * 工時統計卡片組件
 * 統一處理各種工時類型的顯示格式，消除重複代碼
 */
const WorkHoursStatCard = ({ 
  label, 
  value, 
  color = 'text.primary', 
  subtitle = null, 
  minWidth = '100px' 
}) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth
    }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color={color}>
        {typeof value === 'number' ? `${value.toFixed(1)} 小時` : value}
        {subtitle && (
          <Typography variant="caption" display="block" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Typography>
    </Box>
  );
};

WorkHoursStatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
  subtitle: PropTypes.string,
  minWidth: PropTypes.string
};

export default WorkHoursStatCard;