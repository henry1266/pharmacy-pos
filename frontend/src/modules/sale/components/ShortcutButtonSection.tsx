/**
 * @file 快捷按鈕區域組件
 * @description 顯示銷售頁面中的快捷按鈕區域，允許用戶快速選擇常用商品或套餐
 */

import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';
import ShortcutButtonManager from './ShortcutButtonManager';
import { Product } from '@pharmacy-pos/shared/types/entities';
import { UserShortcut } from '../types';

interface ShortcutButtonSectionProps {
  /** 所有可用的產品列表 */
  allProducts: Product[];
  /** 所有可用的套餐列表 */
  allPackages: any[];
  /** 是否處於測試模式 */
  isTestMode: boolean;
  /** 是否為小螢幕手機 */
  isSmallMobile: boolean;
  /** 是否為平板 */
  isTablet: boolean;
  /** 快捷按鈕選擇處理函數 */
  onShortcutSelect: (shortcut: UserShortcut) => void;
}

/**
 * 快捷按鈕區域組件
 * 顯示銷售頁面中的快捷按鈕區域，允許用戶快速選擇常用商品或套餐
 */
const ShortcutButtonSection: FC<ShortcutButtonSectionProps> = ({
  allProducts,
  allPackages,
  isTestMode,
  isSmallMobile,
  isTablet,
  onShortcutSelect
}) => {
  return (
    <Box sx={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: {
        xs: 0.75,        // 小手機：進一步減少間距
        sm: 0.75,        // 平板：進一步減少間距
        md: 1,           // 平板橫向：減少間距
        lg: 1.5          // 桌面：減少間距
      },
      alignItems: 'center',
      justifyContent: 'center',
      p: {
        xs: 0.75,        // 小手機：進一步減少內距
        sm: 0.5,         // 平板：大幅減少內距
        md: 0.75,        // 平板橫向：大幅減少內距
        lg: 1.5          // 桌面：大幅減少內距
      },
      position: 'relative',
      overflow: 'hidden',
      background: `linear-gradient(135deg, rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.4) 0%, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.03) 50%, rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.6) 100%)`,
      boxShadow: `0 1px 3px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08), 0 4px 12px 0 rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.03)`,
      borderRadius: {
        xs: '16px',
        sm: '12px',      // 平板：縮小圓角
        md: '16px',      // 平板橫向：縮小圓角
        lg: 'var(--shape-corner-extra-large, 28px)' // 桌面：保持原有
      },
      border: `1px solid rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.12)`,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(0, 0, 0, 0.01) 100%)`,
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }
    }}>
      <Typography
        variant={isSmallMobile ? "body1" : "subtitle1"}
        sx={{
          color: `rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.85)`,
          fontWeight: 600,
          fontSize: {
            xs: isSmallMobile ? '0.9rem' : '1rem',
            sm: isTablet ? '0.9rem' : '1rem',    // 平板：縮小字體
            md: '1rem',      // 平板橫向：縮小字體
            lg: '1.2rem'     // 桌面：保持原有
          },
          mr: {
            xs: isSmallMobile ? 0.5 : 1,
            sm: isTablet ? 0.75 : 1,           // 平板：減少間距
            md: 1.5,         // 平板橫向：減少間距
            lg: 2            // 桌面：保持原有
          },
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: isSmallMobile || isTablet ? 0.3 : 0.5  // 小螢幕時進一步減少圖示間距
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: {
              xs: isSmallMobile ? '1.1rem' : '1.2rem',
              sm: isTablet ? '1rem' : '1.1rem',    // 平板：縮小圖示
              md: '1.2rem',    // 平板橫向：縮小圖示
              lg: '1.4rem'     // 桌面：保持原有
            },
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
            display: isSmallMobile ? 'inline-flex' : 'inline-block'
          }}
        >
          ⚡
        </Box>
        快捷按鈕：
      </Typography>
      <ShortcutButtonManager
        onShortcutSelect={onShortcutSelect}
        allProducts={allProducts}
        allPackages={allPackages}
        isTestMode={isTestMode}
      />
    </Box>
  );
};

export default ShortcutButtonSection;