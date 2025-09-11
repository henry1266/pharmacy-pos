import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';

/**
 * 載入骨架屏組件
 * 在數據載入過程中顯示的佔位元素
 */
export const LoadingSkeleton: React.FC = () => {
  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      bgcolor: 'background.paper',
      borderRadius: 1,
      p: 4
    }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        資料載入中...
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        請稍候，系統正在處理您的請求
      </Typography>
      
      {/* 添加一些骨架屏元素，增強視覺效果 */}
      <Box sx={{ width: '80%', maxWidth: 800 }}>
        <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={40} />
      </Box>
    </Box>
  );
};

export default LoadingSkeleton;