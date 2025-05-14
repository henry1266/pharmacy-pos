import React from 'react';
import GenericConfirmDialog from '../../../components/common/GenericConfirmDialog'; // Updated import path

/**
 * 確認刪除出貨單的對話框
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 是否顯示對話框
 * @param {Function} props.onClose - 關閉對話框的處理函數
 * @param {Function} props.onConfirm - 確認操作的處理函數
 * @param {Object} props.shippingOrder - 出貨單對象
 * @returns {React.ReactElement} 確認對話框組件
 */
const ConfirmDialog = ({ open, onClose, onConfirm, shippingOrder }) => {
  return (
    <GenericConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="確認刪除出貨單"
      message={`您確定要刪除出貨單 ${shippingOrder?.soid || ''} 嗎？此操作無法撤銷。`}
      confirmText="確認"
      cancelText="取消"
      confirmButtonProps={{ autoFocus: true }}
    />
  );
};

export default ConfirmDialog;

