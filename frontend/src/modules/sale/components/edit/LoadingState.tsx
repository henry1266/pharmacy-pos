import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LoadingStateProps } from '../../types/edit';

/**
 * 載入狀態組件
 * 用於顯示載入中的狀態
 * 
 * @param props 組件屬性
 * @returns 載入狀態組件
 */
const LoadingState: React.FC<LoadingStateProps> = ({ message = '載入中...' }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>{message}</Typography>
    </Box>
  );
};

export default LoadingState;