import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

/**
 * 工時統計區塊組件
 * 重構自 WorkHoursDialog 中重複的統計顯示邏輯
 */
const HoursStatBlock = ({ 
  label, 
  value, 
  unit = '小時', 
  color = 'text.primary',
  subtitle 
}) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '100px'
    }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color={color}>
        {value} {unit}
        {subtitle && (
          <Typography variant="caption" display="block" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Typography>
    </Box>
  );
};

HoursStatBlock.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  color: PropTypes.string,
  subtitle: PropTypes.string
};

export default HoursStatBlock;