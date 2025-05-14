import React from 'react';
import GenericConfirmDialog from '../common/GenericConfirmDialog'; // Updated import

/**
 * 確認完成進貨單的對話框
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
    <GenericConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="確認完成進貨單"
      message="將進貨單標記為已完成後，系統將自動更新庫存數量。確定要繼續嗎？"
      confirmText="確認"
      cancelText="取消"
    />
  );
};

export default ConfirmDialog;

