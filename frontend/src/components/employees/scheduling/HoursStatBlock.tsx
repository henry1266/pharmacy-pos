import React from 'react';
import { Box, Typography } from '@mui/material';

// 定義元件 Props 介面
interface HoursStatBlockProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  subtitle?: string;
}

/**
 * 工時統計區塊組件
 * 重構自 WorkHoursDialog 中重複的統計顯示邏輯
 */
const HoursStatBlock: React.FC<HoursStatBlockProps> = ({ 
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

export default HoursStatBlock;