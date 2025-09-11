/**
 * @file 頁面標題區域組件
 * @description 顯示銷售列表頁面的標題和總金額信息
 */

import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';

interface HeaderSectionProps {
  totalAmount: number;
  isTestMode: boolean;
}

/**
 * 頁面標題區域組件
 * 顯示銷售列表頁面的標題和總金額信息
 */
const HeaderSection: FC<HeaderSectionProps> = ({
  totalAmount,
  isTestMode
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="h5" component="h1">
        銷售記錄 {isTestMode && (
          <Typography component="span" sx={{ fontSize: '0.8em', color: 'orange', fontWeight: 'bold' }}>
            (測試模式)
          </Typography>
        )}
      </Typography>
      
      {/* 總金額顯示 */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        px: 2,
        py: 1,
        borderRadius: 2,
        minWidth: 'fit-content'
      }}>
        <Typography variant="caption" sx={{ fontSize: '0.8rem', mr: 1 }}>
          總計
        </Typography>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          ${totalAmount.toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default HeaderSection;