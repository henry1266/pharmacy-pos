import React, { FC } from 'react';
import AccountingForm from '../../daily-journal/components/JournalEntryForm';
import type { FormData } from '@pharmacy-pos/shared/types/accounting';

/**
 * 記帳編輯對話框屬性
 */
interface AccountingEditDialogProps {
  /** 是否顯示對話框 */
  open: boolean;
  /** 是否處於編輯模式 */
  editMode: boolean;
  /** 表單數據 */
  formData: FormData;
  /** 表單載入中狀態 */
  formLoading: boolean;
  /** 關閉對話框的回調函數 */
  onClose: () => void;
  /** 設置表單數據的回調函數 */
  setFormData: (data: FormData) => void;
  /** 提交表單的回調函數 */
  onSubmit: () => Promise<void>;
}

/**
 * 記帳編輯對話框組件
 * 
 * @description 用於編輯記帳記錄的對話框組件，封裝了 AccountingForm
 * 
 * @component
 * @example
 * ```tsx
 * <AccountingEditDialog
 *   open={openEditDialog}
 *   editMode={editMode}
 *   formData={formData}
 *   formLoading={formLoading}
 *   onClose={handleCloseEditDialog}
 *   setFormData={setFormData}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export const AccountingEditDialog: FC<AccountingEditDialogProps> = ({
  open,
  editMode,
  formData,
  formLoading,
  onClose,
  setFormData,
  onSubmit
}) => {
  return (
    <AccountingForm
      open={open}
      onClose={onClose}
      formData={formData}
      setFormData={setFormData}
      editMode={editMode}
      onSubmit={onSubmit}
      loadingSales={formLoading}
    />
  );
};

export default AccountingEditDialog;