/**
 * @file 操作按鈕組件
 * @description 顯示銷售列表頁面的操作按鈕
 */

import React, { FC } from 'react';
import { Button } from '@mui/material';
import {
  ViewList as ViewListIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

interface ActionButtonsProps {
  isTestMode: boolean;
  onAddNewSale: () => void;
  onBackToHome: () => void;
}

/**
 * 操作按鈕組件
 * 顯示銷售列表頁面的操作按鈕，包括新增銷售和返回首頁
 */
const ActionButtons: FC<ActionButtonsProps> = ({
  isTestMode,
  onAddNewSale,
  onBackToHome
}) => {
  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<ViewListIcon />}
        onClick={onAddNewSale}
        sx={{ mr: 1 }}
      >
        新增銷售 {isTestMode && "(模擬)"}
      </Button>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBackToHome}
      >
        返回首頁
      </Button>
    </>
  );
};

export default ActionButtons;