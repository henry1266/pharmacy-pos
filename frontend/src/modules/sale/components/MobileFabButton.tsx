/**
 * @file 手機版浮動按鈕組件
 * @description 在手機版顯示的浮動按鈕，用於打開銷售記錄抽屜
 */

import React, { FC } from 'react';
import { Fab, Badge } from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

interface MobileFabButtonProps {
  /** 銷售記錄數量 */
  salesCount: number;
  /** 是否為平板 */
  isTablet: boolean;
  /** 點擊按鈕時的處理函數 */
  onClick: () => void;
}

/**
 * 手機版浮動按鈕組件
 * 在手機版顯示的浮動按鈕，用於打開銷售記錄抽屜
 */
const MobileFabButton: FC<MobileFabButtonProps> = ({
  salesCount,
  isTablet,
  onClick
}) => {
  return (
    <Fab
      color="primary"
      aria-label="銷售紀錄"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: isTablet ? 120 : 24, // 平板大幅提高位置，避免與總計重疊
        left: isTablet ? 24 : undefined,  // 平板改為左側
        right: isTablet ? undefined : 24, // 小手機保持右側
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        }
      }}
    >
      <Badge
        badgeContent={salesCount}
        color="secondary"
        max={99}
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.7rem',
            minWidth: '18px',
            height: '18px',
            top: -8,
            right: -8
          }
        }}
      >
        <ReceiptIcon />
      </Badge>
    </Fab>
  );
};

export default MobileFabButton;