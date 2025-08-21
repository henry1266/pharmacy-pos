import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateMessageProps {
  message: string;
  subMessage?: string;
}

/**
 * 空狀態提示元件
 * 顯示無數據時的提示信息
 */
const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({ message, subMessage }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: subMessage ? 1 : 0 }}>
        {message}
      </Typography>
      {subMessage && (
        <Typography variant="caption" color="text.secondary">
          {subMessage}
        </Typography>
      )}
    </Box>
  );
};

export default memo(EmptyStateMessage);