import React from 'react';
import { 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';

/**
 * 確認對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 是否顯示對話框
 * @param {Function} props.onClose - 關閉對話框的函數
 * @param {Function} props.onConfirm - 確認操作的函數
 * @returns {React.ReactElement} 確認對話框組件
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>確認完成進貨單</DialogTitle>
      <DialogContent>
        <DialogContentText>
          將進貨單標記為已完成後，系統將自動更新庫存數量。確定要繼續嗎？
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onConfirm} color="primary">
          確認
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
