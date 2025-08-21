import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { NotificationSnackbarProps } from '../../types/edit';

/**
 * 通知提示組件
 * 用於顯示操作結果的通知提示
 * 
 * @param props 組件屬性
 * @returns 通知提示組件
 */
const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({ snackbar, handleCloseSnackbar }) => {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;