import React from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

/**
 * 通用確認對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 對話框是否開啟
 * @param {string} props.title - 對話框標題
 * @param {string} props.content - 對話框內容
 * @param {string} props.confirmText - 確認按鈕文字
 * @param {string} props.cancelText - 取消按鈕文字
 * @param {Function} props.onConfirm - 確認按鈕點擊處理函數
 * @param {Function} props.onCancel - 取消按鈕點擊處理函數
 * @returns {React.ReactElement} 確認對話框組件
 */
const ConfirmDialog = ({
  open,
  title,
  content,
  confirmText = '確認',
  cancelText = '取消',
  confirmColor = 'primary',
  onConfirm,
  onCancel
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color={confirmColor} autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
