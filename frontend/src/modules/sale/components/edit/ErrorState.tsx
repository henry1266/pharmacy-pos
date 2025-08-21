import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { ErrorStateProps } from '../../types/edit';

/**
 * 錯誤狀態組件
 * 用於顯示錯誤信息和返回按鈕
 * 
 * @param props 組件屬性
 * @returns 錯誤狀態組件
 */
const ErrorState: React.FC<ErrorStateProps> = ({ error, onBack }) => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography color="error" gutterBottom>獲取銷售數據時發生錯誤:</Typography>
      <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>
      <Button 
        variant="contained" 
        onClick={onBack}
        startIcon={<ArrowBackIcon />}
      >
        返回銷售列表
      </Button>
    </Box>
  );
};

export default ErrorState;