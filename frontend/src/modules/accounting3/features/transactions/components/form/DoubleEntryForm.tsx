import React from 'react';
import { TransactionEntryForm } from './TransactionEntryForm';
import {
  EmbeddedAccountingEntryFormData
} from '@pharmacy-pos/shared';

interface DoubleEntryFormProps {
  entries: EmbeddedAccountingEntryFormData[];
  onChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  organizationId?: string;
  isCopyMode?: boolean;
  disabled?: boolean;
}

/**
 * 複式記帳分錄表單組件
 * 
 * 此組件是 TransactionEntryForm 的包裝器，保持向後相容性
 * 所有功能已遷移到模組化的子組件中：
 * - EntryTable: 處理分錄表格顯示和操作
 * - BalanceValidator: 處理平衡驗證和狀態顯示
 * - TransactionEntryForm: 協調各子組件的主要組件
 */
export const DoubleEntryForm: React.FC<DoubleEntryFormProps> = (props) => {
  console.log('[Accounting3] 🔍 DoubleEntryForm 渲染:', {
    entriesCount: props.entries.length,
    organizationId: props.organizationId,
    isCopyMode: props.isCopyMode,
    disabled: props.disabled
  });

  return <TransactionEntryForm {...props} />;
};

export default DoubleEntryForm;