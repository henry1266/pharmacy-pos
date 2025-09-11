/**
 * @file 通知提示組件
 * @description 顯示銷售列表頁面的通知提示
 */

import React, { FC } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { SnackbarState } from '../../types/list';

interface NotificationSnackbarProps {
  snackbar: SnackbarState;
  onClose: () => void;
}

/**
 * 通知提示組件
 * 顯示銷售列表頁面的通知提示，如操作成功或失敗的消息
 */
const NotificationSnackbar: FC<NotificationSnackbarProps> = ({
  snackbar,
  onClose
}) => {
  return (
    <Snackbar 
      open={snackbar.open} 
      autoHideDuration={3000} 
      onClose={onClose} 
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={snackbar.severity} 
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;