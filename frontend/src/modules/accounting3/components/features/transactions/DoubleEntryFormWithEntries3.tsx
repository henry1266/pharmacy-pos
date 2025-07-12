import React from 'react';
import { TransactionEntryForm } from '../../../../accounting2/components/features/transactions/TransactionEntryForm';
import {
  EmbeddedAccountingEntryFormData
} from '@pharmacy-pos/shared';

interface DoubleEntryFormWithEntries3Props {
  entries: EmbeddedAccountingEntryFormData[];
  onChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  organizationId?: string;
  isCopyMode?: boolean;
  disabled?: boolean;
}

/**
 * 複式記帳分錄表單組件 (Accounting3 版本)
 * 
 * 此組件是 TransactionEntryForm3 的包裝器，保持向後相容性
 * 所有功能已遷移到模組化的子組件中：
 * - EntryTable3: 處理分錄表格顯示和操作
 * - BalanceValidator3: 處理平衡驗證和狀態顯示
 * - TransactionEntryForm3: 協調各子組件的主要組件
 */
export const DoubleEntryFormWithEntries3: React.FC<DoubleEntryFormWithEntries3Props> = (props) => {
  console.log('[Accounting3] 🔍 DoubleEntryFormWithEntries3 渲染:', {
    entriesCount: props.entries.length,
    organizationId: props.organizationId,
    isCopyMode: props.isCopyMode,
    disabled: props.disabled
  });

  return <TransactionEntryForm {...props} />;
};

export default DoubleEntryFormWithEntries3;