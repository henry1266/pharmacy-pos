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
 * 刪除確認對話框組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 對話框是否開啟
 * @param {Function} props.onClose - 關閉對話框的處理函數
 * @param {Function} props.onConfirm - 確認刪除的處理函數
 * @param {Object} props.purchaseOrder - 要刪除的進貨單
 * @returns {React.ReactElement} 刪除確認對話框組件
 */
const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  purchaseOrder
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>確認刪除</DialogTitle>
      <DialogContent>
        <DialogContentText>
          您確定要刪除進貨單 "{purchaseOrder?.poid}" 嗎？此操作無法撤銷。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onConfirm} color="error">
          刪除
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
