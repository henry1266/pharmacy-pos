import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  DialogProps,
  DialogTitleProps,
  DialogContentProps,
  DialogContentTextProps,
  DialogActionsProps,
  ButtonProps
} from '@mui/material';

/**
 * 通用確認對話框組件
 */
interface GenericConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  dialogProps?: Partial<DialogProps>;
  titleProps?: Partial<DialogTitleProps>;
  contentProps?: Partial<DialogContentProps>;
  contentTextProps?: Partial<DialogContentTextProps>;
  actionsProps?: Partial<DialogActionsProps>;
  confirmButtonProps?: Partial<ButtonProps>;
  cancelButtonProps?: Partial<ButtonProps>;
}

const GenericConfirmDialog: React.FC<GenericConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = '取消',
  dialogProps = {},
  titleProps = {},
  contentProps = {},
  contentTextProps = {},
  actionsProps = {},
  confirmButtonProps = {},
  cancelButtonProps = {}
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="generic-confirm-dialog-title"
      aria-describedby="generic-confirm-dialog-description"
      {...dialogProps}
    >
      {title && <DialogTitle id="generic-confirm-dialog-title" {...titleProps}>{title}</DialogTitle>}
      {message && (
        <DialogContent {...contentProps}>
          {typeof message === 'string' ? (
            <DialogContentText id="generic-confirm-dialog-description" {...contentTextProps}>
              {message}
            </DialogContentText>
          ) : (
            message
          )}
        </DialogContent>
      )}
      <DialogActions {...actionsProps}>
        <Button onClick={onClose} {...cancelButtonProps}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color="primary" autoFocus {...confirmButtonProps}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenericConfirmDialog;