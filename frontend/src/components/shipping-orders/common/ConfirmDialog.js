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
 * @param {boolean} props.open - 是否顯示對話框
 * @param {Function} props.onClose - 關閉對話框的處理函數
 * @param {Function} props.onConfirm - 確認操作的處理函數
 * @param {Object} props.shippingOrder - 出貨單對象
 * @returns {React.ReactElement} 確認對話框組件
 */
const ConfirmDialog = ({ open, onClose, onConfirm, shippingOrder }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        確認刪除出貨單
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          您確定要刪除出貨單 {shippingOrder?.soid || ''} 嗎？此操作無法撤銷。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          取消
        </Button>
        <Button onClick={onConfirm} color="primary" autoFocus>
          確認
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
