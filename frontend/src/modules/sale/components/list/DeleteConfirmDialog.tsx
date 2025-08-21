/**
 * @file 刪除確認對話框組件
 * @description 顯示刪除銷售記錄的確認對話框
 */

import React, { FC } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';

interface DeleteConfirmDialogProps {
  open: boolean;
  saleId: string | null;
  isTestMode: boolean;
  onClose: () => void;
  onConfirm: (saleId: string) => void;
}

/**
 * 刪除確認對話框組件
 * 顯示刪除銷售記錄的確認對話框
 */
const DeleteConfirmDialog: FC<DeleteConfirmDialogProps> = ({
  open,
  saleId,
  isTestMode,
  onClose,
  onConfirm
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>確認刪除</DialogTitle>
      <DialogContent>
        <DialogContentText>
          您確定要刪除這筆銷售記錄嗎？{isTestMode ? "(測試模式下僅模擬刪除)" : "此操作將恢復相應的庫存，且無法撤銷。"}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={() => saleId && onConfirm(saleId)} color="error" autoFocus>
          刪除
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;