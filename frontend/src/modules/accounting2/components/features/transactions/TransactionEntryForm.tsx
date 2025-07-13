import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography
} from '@mui/material';
import { useAppSelector } from '@/hooks/redux';
import { AccountSelector } from '../accounts/AccountSelector';
//import { FundingSourceSelector } from '../../ui/FundingSourceSelector';
import { EntryTable } from './EntryTable';
import { BalanceValidator } from './BalanceValidator';
import {
  EmbeddedAccountingEntryFormData,
  TransactionGroupWithEntries,
  TransactionGroup
} from '@pharmacy-pos/shared';
import { embeddedEntriesHelpers } from '@services/transactionGroupWithEntriesService';

interface TransactionEntryFormProps {
  entries: EmbeddedAccountingEntryFormData[];
  onChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  organizationId?: string;
  isCopyMode?: boolean;
  disabled?: boolean;
}

interface AccountOption {
  _id: string;
  name: string;
  code: string;
  accountType: string;
  normalBalance: 'debit' | 'credit';
  organizationId?: string;
  parentId?: string;
}

/**
 * 交易分錄表單組件 (重構版)
 * 
 * 職責：
 * - 協調各個子組件的交互
 * - 管理分錄資料狀態
 * - 處理科目和資金來源選擇
 * - 提供統一的業務邏輯接口
 */
export const TransactionEntryForm: React.FC<TransactionEntryFormProps> = ({
  entries,
  onChange,
  organizationId,
  isCopyMode = false,
  disabled = false
}) => {
  const { accounts, loading: accountsLoading, error: accountsError } = useAppSelector(state => state.account2 || { accounts: [], loading: false, error: null });

  // 科目選擇對話框狀態
  const [accountSelectorOpen, setAccountSelectorOpen] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number>(-1);

  // 分錄資金來源選擇對話框狀態
  const [entryFundingSourceOpen, setEntryFundingSourceOpen] = useState(false);
  const [currentFundingEditingIndex, setCurrentFundingEditingIndex] = useState<number>(-1);

  // 過濾可用的會計科目
  const availableAccounts: AccountOption[] = accounts.filter(account =>
    account.isActive && (!organizationId || account.organizationId === organizationId)
  );

  // 確保至少有兩個分錄
  useEffect(() => {
    if (entries.length === 0) {
      const defaultEntries: EmbeddedAccountingEntryFormData[] = [
        {
          accountId: '',
          debitAmount: 0,
          creditAmount: 0,
          description: ''
        },
        {
          accountId: '',
          debitAmount: 0,
          creditAmount: 0,
          description: ''
        }
      ];
      onChange(defaultEntries);
    }
  }, [entries.length, onChange]);

  // 處理複製模式下的分錄描述清空
  useEffect(() => {
    if (isCopyMode && entries.length > 0) {
      console.log('🔄 TransactionEntryForm - 複製模式，清空分錄描述:', { isCopyMode, entriesCount: entries.length });
      
      const needsClear = entries.some(entry => entry.description && entry.description.trim() !== '');
      
      if (needsClear) {
        const clearedEntries = entries.map(entry => ({
          ...entry,
          description: ''
        }));
        
        console.log('✅ TransactionEntryForm - 清空分錄描述完成');
        onChange(clearedEntries);
      }
    }
  }, [isCopyMode, entries, onChange]);

  // 使用服務層的借貸平衡計算
  const balanceInfo = useMemo(() => {
    return embeddedEntriesHelpers.calculateBalance(entries);
  }, [entries]);

  // 驗證分錄完整性
  const validationResult = useMemo(() => {
    return embeddedEntriesHelpers.validateEntries(entries);
  }, [entries]);

  // 新增分錄
  const handleAddEntry = useCallback(() => {
    const newEntry: EmbeddedAccountingEntryFormData = {
      accountId: '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    };
    const newEntries = [...entries, newEntry];
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    onChange(entriesWithSequence);
  }, [entries, onChange]);

  // 刪除分錄
  const handleRemoveEntry = useCallback((index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    onChange(entriesWithSequence);
  }, [entries, onChange]);

  // 更新分錄
  const handleUpdateEntry = useCallback((index: number, field: keyof EmbeddedAccountingEntryFormData, value: any) => {
    console.log('🔄 updateEntry 被調用:', { index, field, value, currentValue: entries[index]?.[field] });
    
    const newEntries = [...entries];
    const currentEntry = newEntries[index];
    
    if (!currentEntry) {
      console.warn('⚠️ updateEntry: 找不到指定索引的分錄:', index);
      return;
    }

    // 更新指定欄位
    newEntries[index] = {
      ...currentEntry,
      [field]: value
    };

    // 如果是金額欄位，確保另一個金額為 0
    if (field === 'debitAmount' && value > 0) {
      newEntries[index].creditAmount = 0;
      console.log('💰 設定借方金額，清除貸方金額:', { debitAmount: value });
    } else if (field === 'creditAmount' && value > 0) {
      newEntries[index].debitAmount = 0;
      console.log('💰 設定貸方金額，清除借方金額:', { creditAmount: value });
    }

    // 如果是科目選擇變更，記錄詳細資訊
    if (field === 'accountId') {
      const selectedAccount = availableAccounts.find(acc => acc._id === value);
      console.log('🏦 科目選擇變更:', {
        index,
        oldAccountId: currentEntry.accountId,
        newAccountId: value,
        accountName: selectedAccount?.name || '未知',
        accountCode: selectedAccount?.code || '未知'
      });
    }

    // 重新分配序號
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    console.log('✅ updateEntry 完成，新的分錄狀態:', entriesWithSequence[index]);
    onChange(entriesWithSequence);
  }, [entries, onChange, availableAccounts]);

  // 開啟科目選擇對話框
  const handleOpenAccountSelector = useCallback((index: number) => {
    setCurrentEditingIndex(index);
    setAccountSelectorOpen(true);
  }, []);

  // 處理科目選擇
  const handleAccountSelect = useCallback((account: AccountOption) => {
    if (currentEditingIndex >= 0) {
      handleUpdateEntry(currentEditingIndex, 'accountId', account._id);
      setAccountSelectorOpen(false);
      setCurrentEditingIndex(-1);
    }
  }, [currentEditingIndex, handleUpdateEntry]);

  // 關閉科目選擇對話框
  const handleCloseAccountSelector = useCallback(() => {
    setAccountSelectorOpen(false);
    setCurrentEditingIndex(-1);
  }, []);

  // 開啟分錄資金來源選擇對話框
  const handleOpenEntryFundingSource = useCallback((index: number) => {
    setCurrentFundingEditingIndex(index);
    setEntryFundingSourceOpen(true);
  }, []);

  // 處理分錄資金來源選擇
  const handleEntryFundingSourceSelect = useCallback((sourceTransaction: TransactionGroup) => {
    if (currentFundingEditingIndex >= 0) {
      handleUpdateEntry(currentFundingEditingIndex, 'sourceTransactionId', sourceTransaction._id);
      
      console.log('🔗 設定分錄資金來源:', {
        entryIndex: currentFundingEditingIndex,
        sourceTransactionId: sourceTransaction._id,
        sourceDescription: sourceTransaction.description
      });
    }
    setEntryFundingSourceOpen(false);
    setCurrentFundingEditingIndex(-1);
  }, [currentFundingEditingIndex, handleUpdateEntry]);

  // 關閉分錄資金來源選擇對話框
  const handleCloseEntryFundingSource = useCallback(() => {
    setEntryFundingSourceOpen(false);
    setCurrentFundingEditingIndex(-1);
  }, []);

  // 移除分錄資金來源
  const handleRemoveEntryFundingSource = useCallback((index: number) => {
    handleUpdateEntry(index, 'sourceTransactionId', undefined);
    console.log('🗑️ 移除分錄資金來源:', { entryIndex: index });
  }, [handleUpdateEntry]);

  // 快速平衡功能
  const handleQuickBalance = useCallback(() => {
    if (entries.length < 2) return;

    const newEntries = [...entries];
    const lastEntry = newEntries[newEntries.length - 1];
    
    if (balanceInfo.totalDebit > balanceInfo.totalCredit) {
      lastEntry.creditAmount = balanceInfo.totalDebit - (balanceInfo.totalCredit - lastEntry.creditAmount);
      lastEntry.debitAmount = 0;
    } else if (balanceInfo.totalCredit > balanceInfo.totalDebit) {
      lastEntry.debitAmount = balanceInfo.totalCredit - (balanceInfo.totalDebit - lastEntry.debitAmount);
      lastEntry.creditAmount = 0;
    }

    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    onChange(entriesWithSequence);
  }, [entries, balanceInfo, onChange]);

  // 借貸對調功能
  const handleSwapDebitCredit = useCallback(() => {
    const newEntries = entries.map(entry => ({
      ...entry,
      debitAmount: entry.creditAmount,
      creditAmount: entry.debitAmount
    }));
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    onChange(entriesWithSequence);
  }, [entries, onChange]);

  // 如果會計科目正在載入，顯示載入提示
  if (accountsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          載入會計科目資料中...
        </Typography>
      </Box>
    );
  }

  // 如果會計科目載入失敗，顯示錯誤提示
  if (accountsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        載入會計科目失敗：{accountsError}
      </Alert>
    );
  }

  // 如果沒有可用的會計科目，顯示提示
  if (availableAccounts.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {organizationId ?
          `找不到機構 ${organizationId} 的可用會計科目，請先建立會計科目。` :
          '找不到可用的會計科目，請先建立會計科目。'
        }
      </Alert>
    );
  }

  return (
    <Box>
      {/* 分錄表格 */}
      <EntryTable
        entries={entries}
        availableAccounts={availableAccounts}
        balanceInfo={balanceInfo}
        disabled={disabled}
        onUpdateEntry={handleUpdateEntry}
        onAddEntry={handleAddEntry}
        onRemoveEntry={handleRemoveEntry}
        onOpenAccountSelector={handleOpenAccountSelector}
        onOpenFundingSource={handleOpenEntryFundingSource}
        onRemoveFundingSource={handleRemoveEntryFundingSource}
      />

      {/* 平衡驗證器 */}
      <BalanceValidator
        entries={entries}
        balanceInfo={balanceInfo}
        validationResult={validationResult}
        disabled={disabled}
        onQuickBalance={handleQuickBalance}
        onSwapDebitCredit={handleSwapDebitCredit}
      />

      {/* 科目選擇對話框 */}
      <Dialog
        open={accountSelectorOpen}
        onClose={handleCloseAccountSelector}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '600px'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            選擇會計科目
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <AccountSelector
            selectedAccountId={currentEditingIndex >= 0 ? entries[currentEditingIndex]?.accountId : undefined}
            organizationId={organizationId}
            onAccountSelect={handleAccountSelect}
            onCancel={handleCloseAccountSelector}
          />
        </DialogContent>
      </Dialog>


    </Box>
  );
};

export default TransactionEntryForm;