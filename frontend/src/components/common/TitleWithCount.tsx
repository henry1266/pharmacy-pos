import React from 'react';
import { Box, Typography } from '@mui/material';

interface TitleWithCountProps {
  title: string;
  count: number;
}

/**
 * 標題與數量顯示組件
 *
 * 用於在標題旁邊顯示帶有底色的數量
 * 參考 PurchaseOrdersPage 的設計
 */
const TitleWithCount: React.FC<TitleWithCountProps> = ({ title, count }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* 使用 component="div" 避免 DOM 嵌套警告 */}
      <Typography variant="inherit" component="div">
        {title}
      </Typography>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'secondary.main',
        color: 'secondary.contrastText',
        px: 2,
        py: 0.5,
        borderRadius: 2,
        minWidth: 'fit-content'
      }}>
        <Typography variant="caption" component="div" sx={{ fontSize: '0.8rem', mr: 1 }}>
          筆數
        </Typography>
        {/* 使用 component="div" 避免 h6 嵌套在 p 中的警告 */}
        <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          {count}
        </Typography>
      </Box>
    </Box>
  );
};

export default TitleWithCount;