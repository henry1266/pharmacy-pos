import React from 'react';
import { TransactionEntryForm } from './TransactionEntryForm';
import {
  EmbeddedAccountingEntryFormData
} from '@pharmacy-pos/shared';

interface DoubleEntryFormWithEntriesProps {
  entries: EmbeddedAccountingEntryFormData[];
  onChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  organizationId?: string;
  isCopyMode?: boolean;
  disabled?: boolean;
}

/**
 * 複式記帳分錄表單組件 (重構版包裝器)
 * 
 * 此組件現在是 TransactionEntryForm 的包裝器，保持向後相容性
 * 所有功能已遷移到模組化的子組件中：
 * - EntryTable: 處理分錄表格顯示和操作
 * - BalanceValidator: 處理平衡驗證和狀態顯示
 * - TransactionEntryForm: 協調各子組件的主要組件
 * 
 * @deprecated 建議直接使用 TransactionEntryForm 組件
 */
export const DoubleEntryFormWithEntries: React.FC<DoubleEntryFormWithEntriesProps> = (props) => {
  return <TransactionEntryForm {...props} />;
};

export default DoubleEntryFormWithEntries;