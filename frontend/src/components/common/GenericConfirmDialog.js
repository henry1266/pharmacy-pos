import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';

/**
 * 通用確認對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 是否顯示對話框
 * @param {Function} props.onClose - 關閉對話框的函數
 * @param {Function} props.onConfirm - 確認操作的函數
 * @param {string} props.title - 對話框標題
 * @param {string | React.ReactNode} props.message - 對話框內容訊息
 * @param {string} [props.confirmText='確認'] - 確認按鈕文字
 * @param {string} [props.cancelText='取消'] - 取消按鈕文字
 * @param {Object} [props.dialogProps] - 傳遞給 MUI Dialog 元件的其他 props
 * @param {Object} [props.titleProps] - 傳遞給 MUI DialogTitle 元件的其他 props
 * @param {Object} [props.contentProps] - 傳遞給 MUI DialogContent 元件的其他 props
 * @param {Object} [props.contentTextProps] - 傳遞給 MUI DialogContentText 元件的其他 props
 * @param {Object} [props.actionsProps] - 傳遞給 MUI DialogActions 元件的其他 props
 * @param {Object} [props.confirmButtonProps] - 傳遞給確認按鈕的其他 props
 * @param {Object} [props.cancelButtonProps] - 傳遞給取消按鈕的其他 props
 * @returns {React.ReactElement} 通用確認對話框組件
 */
const GenericConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = '取消',
  dialogProps,
  titleProps,
  contentProps,
  contentTextProps,
  actionsProps,
  confirmButtonProps,
  cancelButtonProps
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

// 添加 PropTypes 驗證
GenericConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  dialogProps: PropTypes.object,
  titleProps: PropTypes.object,
  contentProps: PropTypes.object,
  contentTextProps: PropTypes.object,
  actionsProps: PropTypes.object,
  confirmButtonProps: PropTypes.object,
  cancelButtonProps: PropTypes.object
};

// 添加預設值
GenericConfirmDialog.defaultProps = {
  confirmText: '確認',
  cancelText: '取消',
  dialogProps: {},
  titleProps: {},
  contentProps: {},
  contentTextProps: {},
  actionsProps: {},
  confirmButtonProps: {},
  cancelButtonProps: {}
};

export default GenericConfirmDialog;
