import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress
} from '@mui/material';

// 定義元件 Props 介面
interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  confirmText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  submitting?: boolean;
  children?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

/**
 * 統一的帳號管理對話框組件
 * 重構自 EmployeeAccountManager 中重複的對話框結構
 */
const AccountDialog: React.FC<AccountDialogProps> = ({
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

export default AccountDialog;