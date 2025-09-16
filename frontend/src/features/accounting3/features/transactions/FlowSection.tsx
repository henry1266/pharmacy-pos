import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { FlowSectionProps } from './types';

/**
 * 流向區塊組件
 * 提供統一的區塊結構，包含標題、計數、狀態標籤和摘要
 */
const FlowSection: React.FC<FlowSectionProps> = ({ 
  title, 
  count, 
  children, 
  summary, 
  statusChip 
}) => {
  return (
    <Box sx={{ mb: 2, p: 2, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        {count !== undefined && count > 0 && (
          <Chip
            label={`${count} 筆`}
            color="primary"
            size="small"
          />
        )}
        {statusChip && (
          <Box sx={{ ml: 'auto' }}>
            {statusChip}
          </Box>
        )}
      </Box>
      
      {children}
      
      {summary && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'white', borderRadius: 1 }}>
          {summary}
        </Box>
      )}
    </Box>
  );
};

export default FlowSection;