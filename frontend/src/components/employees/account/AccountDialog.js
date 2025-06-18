import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress
} from '@mui/material';

/**
 * 統一的帳號管理對話框組件
 * 重構自 EmployeeAccountManager 中重複的對話框結構
 */
const AccountDialog = ({
  open,
  onClose,
  title,
  description,
  onConfirm,
  confirmText = '確認',
  confirmColor = 'primary',
  submitting = false,
  children,
  maxWidth = 'sm',
  fullWidth = true
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth={fullWidth}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description && (
          <DialogContentText sx={{ mb: 2 }}>
            {description}
          </DialogContentText>
        )}
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button
          onClick={onConfirm}
          disabled={submitting}
          variant="contained"
          color={confirmColor}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? '處理中...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AccountDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  confirmColor: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  submitting: PropTypes.bool,
  children: PropTypes.node,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool
};

export default AccountDialog;