/**
 * @file 手機版銷售記錄抽屜組件
 * @description 在手機版顯示的銷售記錄抽屜，用於查看當天的銷售記錄
 */

import React, { FC } from 'react';
import { Box, Typography, Button, Drawer, Badge } from '@mui/material';
import { Receipt as ReceiptIcon, Close as CloseIcon } from '@mui/icons-material';
import DailySalesPanel from '@/features/dashboard/components/DailySalesPanel';

interface MobileSalesDrawerProps {
  /** 是否開啟抽屜 */
  open: boolean;
  /** 關閉抽屜的處理函數 */
  onClose: () => void;
  /** 銷售記錄列表 */
  sales: any[];
  /** 是否正在載入 */
  loading: boolean;
  /** 錯誤訊息 */
  error: string | null;
  /** 是否處於測試模式 */
  isTestMode: boolean;
  /** 是否為平板 */
  isTablet: boolean;
  /** 搜尋條件 */
  searchTerm: string;
  /** 搜尋條件變更處理函數 */
  onSearchChange: (value: string) => void;
}

/**
 * 手機版銷售記錄抽屜組件
 * 在手機版顯示的銷售記錄抽屜，用於查看當天的銷售記錄
 */
const MobileSalesDrawer: FC<MobileSalesDrawerProps> = ({
  open,
  onClose,
  sales,
  loading,
  error,
  isTestMode,
  isTablet,
  searchTerm,
  onSearchChange
}) => {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: isTablet ? '60vh' : '70vh', // 平板使用較小高度
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden'
        }
      }}
      ModalProps={{
        keepMounted: true, // 保持掛載以提升性能
      }}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* 抽屜標題列 */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6" component="h2">
              銷售紀錄
              {isTestMode && (
                <Typography component="span" sx={{
                  fontSize: '0.8em',
                  color: 'orange',
                  fontWeight: 'bold',
                  ml: 1
                }}>
                  (測試模式)
                </Typography>
              )}
            </Typography>
            <Badge
              badgeContent={sales.length}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  minWidth: '16px',
                  height: '16px'
                }
              }}
            />
          </Box>
          <Button
            variant="text"
            startIcon={<CloseIcon />}
            onClick={onClose}
            size="small"
            sx={{ minWidth: 'auto', px: 1 }}
          >
            關閉
          </Button>
        </Box>
        
        {/* 銷售紀錄內容 */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <DailySalesPanel
            sales={sales}
            loading={loading}
            error={error}
            targetDate={new Date().toISOString()}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default MobileSalesDrawer;