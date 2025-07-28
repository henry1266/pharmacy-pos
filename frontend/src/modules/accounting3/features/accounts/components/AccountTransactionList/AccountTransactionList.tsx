import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { TransactionGroupWithEntries, EmbeddedAccountingEntry } from '@pharmacy-pos/shared/types/accounting2';
import { accounting3Service } from '../../../../services/accounting3Service';
import { AccountTransactionListStatisticsCards as TransactionStatisticsCards } from './AccountTransactionListStatisticsCards';
import { AccountTransactionListDetailDialog as TransactionDetailDialog } from './AccountTransactionListDetailDialog';
import { AccountTransactionListTable as TransactionTable } from './AccountTransactionListTable';

// 臨時型別擴展，確保 referencedByInfo 和 fundingSourceUsages 屬性可用
interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
  }>;
  fundingSourceUsages?: Array<{
    sourceTransactionId: string;
    usedAmount: number;
    sourceTransactionDescription?: string;
    sourceTransactionGroupNumber?: string;
    sourceTransactionDate?: Date | string;
    sourceTransactionAmount?: number;
  }>;
  accountAmount?: number;
  runningBalance?: number;
  displayOrder?: number;
}

interface AccountTransactionListProps {
  selectedAccount: Account2 | null;
  onTransactionView?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onTransactionEdit?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onTransactionConfirm?: (id: string) => void;
  onTransactionUnlock?: (id: string) => void;
  onTransactionDelete?: (id: string) => void;
  onTransactionCopy?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onAddTransaction?: (accountId: string) => void;
}

/**
 * 科目交易列表組件
 * 顯示選中科目的相關交易
 */
export const AccountTransactionList: React.FC<AccountTransactionListProps> = ({
  selectedAccount,
  onTransactionView,
  onTransactionEdit,
  onTransactionConfirm,
  onTransactionUnlock,
  onTransactionDelete,
  onTransactionCopy,
  onAddTransaction
}) => {
  const [transactions, setTransactions] = useState<ExtendedTransactionGroupWithEntries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 彈出式對話框狀態
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<ExtendedTransactionGroupWithEntries | null>(null);

  // 載入選中科目的交易
  useEffect(() => {
    if (selectedAccount) {
      loadAccountTransactions(selectedAccount._id);
    } else {
      setTransactions([]);
    }
  }, [selectedAccount]);

  const loadAccountTransactions = async (accountId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('載入科目交易:', accountId);
      
      // 使用 accounting3Service 的交易 API - 提高限制確保與左側統計一致
      const response = await accounting3Service.transactions.getByAccount(accountId, {
        limit: 10000, // 與左側統計保持一致的限制
        page: 1
      });
      
      if (response.success) {
        console.log('交易載入成功:', response.data.length, '筆交易');
        setTransactions(response.data || []);
      } else {
        console.warn('交易載入失敗:', response);
        setTransactions([]);
        setError('載入交易資料失敗');
      }
    } catch (err) {
      console.error('載入科目交易失敗:', err);
      setError('載入交易資料失敗');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 計算科目在交易中的金額（考慮借貸方向）
  const getAccountAmountInTransaction = (transaction: ExtendedTransactionGroupWithEntries, accountId: string) => {
    if (!transaction.entries) return 0;
    
    const accountEntry = transaction.entries.find(entry =>
      (entry as any).accountId === accountId || (entry as any).account === accountId
    );
    
    if (!accountEntry) return 0;
    
    // 根據科目類型決定正負號
    const debitAmount = accountEntry.debitAmount || 0;
    const creditAmount = accountEntry.creditAmount || 0;
    
    // 根據選中科目的類型決定正負號顯示
    if (selectedAccount) {
      const accountType = selectedAccount.accountType;
      
      // 對於資產、費用科目：借方為正，貸方為負
      if (accountType === 'asset' || accountType === 'expense') {
        return debitAmount - creditAmount;
      }
      // 對於負債、權益、收入科目：貸方為正，借方為負
      else if (accountType === 'liability' || accountType === 'equity' || accountType === 'revenue') {
        return creditAmount - debitAmount;
      }
    }
    
    // 預設處理（資產類科目的邏輯）
    return debitAmount - creditAmount;
  };

  // 計算統計資料
  const statistics = useMemo(() => {
    if (!selectedAccount || transactions.length === 0) {
      return {
        totalTransactions: 0,
        totalDebitAmount: 0,
        totalCreditAmount: 0,
        netAmount: 0,
        averageAmount: 0,
        lastTransactionDate: null
      };
    }

    let totalDebitAmount = 0;
    let totalCreditAmount = 0;
    let lastTransactionDate: Date | null = null;

    transactions.forEach(transaction => {
      if (!transaction.entries) return;
      
      const accountEntry = transaction.entries.find(entry =>
        (entry as any).accountId === selectedAccount._id || (entry as any).account === selectedAccount._id
      );
      
      if (accountEntry) {
        totalDebitAmount += accountEntry.debitAmount || 0;
        totalCreditAmount += accountEntry.creditAmount || 0;
        
        const transactionDate = new Date(transaction.transactionDate);
        if (!lastTransactionDate || transactionDate > lastTransactionDate) {
          lastTransactionDate = transactionDate;
        }
      }
    });

    // 根據科目類型計算淨額
    let netAmount = 0;
    if (selectedAccount) {
      const accountType = selectedAccount.accountType;
      
      // 對於資產、費用科目：借方為正，貸方為負
      if (accountType === 'asset' || accountType === 'expense') {
        netAmount = totalDebitAmount - totalCreditAmount;
      }
      // 對於負債、權益、收入科目：貸方為正，借方為負
      else if (accountType === 'liability' || accountType === 'equity' || accountType === 'revenue') {
        netAmount = totalCreditAmount - totalDebitAmount;
      }
      else {
        // 預設處理（資產類科目的邏輯）
        netAmount = totalDebitAmount - totalCreditAmount;
      }
    } else {
      netAmount = totalDebitAmount - totalCreditAmount;
    }
    
    const averageAmount = transactions.length > 0 ? Math.abs(netAmount) / transactions.length : 0;

    return {
      totalTransactions: transactions.length,
      totalDebitAmount,
      totalCreditAmount,
      netAmount,
      averageAmount,
      lastTransactionDate
    };
  }, [selectedAccount, transactions]);

  // 計算帶累計餘額的交易列表（累加順序與顯示順序完全反過來）
  const transactionsWithRunningBalance = useMemo(() => {
    if (!selectedAccount || transactions.length === 0) return [];

    // 穩定排序函數：先按日期，再按 ID 確保同日期交易順序穩定
    const stableSortOldToNew = (a: TransactionGroupWithEntries, b: TransactionGroupWithEntries) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      if (dateA !== dateB) {
        return dateA - dateB; // 舊到新
      }
      // 同日期時按 ID 排序確保穩定性
      return a._id.localeCompare(b._id);
    };

    const stableSortNewToOld = (a: TransactionGroupWithEntries, b: TransactionGroupWithEntries) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // 新到舊
      }
      // 同日期時按 ID 反向排序確保與舊到新的順序一致
      return b._id.localeCompare(a._id);
    };

    // 1. 先按日期排序（從最舊到最新）用於累計餘額計算
    const sortedForBalance = [...transactions].sort(stableSortOldToNew);

    // 2. 從最舊的交易開始累加餘額
    let runningBalance = 0;
    const balanceMap = new Map<string, number>();
    
    sortedForBalance.forEach(transaction => {
      const amount = getAccountAmountInTransaction(transaction, selectedAccount._id);
      runningBalance += amount;
      balanceMap.set(transaction._id, runningBalance);
    });

    // 3. 按日期排序（從最新到最舊）用於顯示，並對應累計餘額
    const sortedForDisplay = [...transactions].sort(stableSortNewToOld);

    // 4. 將累計餘額對應到顯示順序
    return sortedForDisplay.map((transaction, index) => ({
      ...transaction,
      accountAmount: getAccountAmountInTransaction(transaction, selectedAccount._id),
      runningBalance: balanceMap.get(transaction._id) || 0,
      // 添加排序索引用於調試
      displayOrder: index + 1
    }));
  }, [selectedAccount, transactions]);


  if (!selectedAccount) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box textAlign="center" color="text.secondary">
          <ReceiptIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            請選擇科目
          </Typography>
          <Typography variant="body2">
            選擇左側科目以查看相關交易
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 標題區域 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            {selectedAccount.name} 的交易記錄
          </Typography>
          
          {onAddTransaction && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onAddTransaction(selectedAccount._id)}
            >
              新增交易
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={selectedAccount.code}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Typography variant="body2" color="text.secondary">
            {selectedAccount.type}
          </Typography>
        </Box>
      </Box>

      {/* 內容區域 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <Box textAlign="center" color="text.secondary">
              <ReceiptIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body1">
                此科目暫無交易記錄
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {/* Dashboard 統計區域 */}
            <TransactionStatisticsCards statistics={statistics} />
            
            {/* 交易列表 */}
            <TransactionTable
              transactions={transactionsWithRunningBalance}
              selectedAccount={selectedAccount}
              {...(onTransactionView && { onTransactionView })}
              {...(onTransactionEdit && { onTransactionEdit })}
              {...(onTransactionCopy && { onTransactionCopy })}
              {...(onTransactionConfirm && { onTransactionConfirm })}
              {...(onTransactionUnlock && { onTransactionUnlock })}
              {...(onTransactionDelete && { onTransactionDelete })}
            />
          </Box>
        )}
      </Box>

      {/* 交易詳情對話框 */}
      <TransactionDetailDialog
        open={transactionDetailOpen}
        transaction={selectedTransactionForDetail}
        onClose={() => setTransactionDetailOpen(false)}
      />
    </Paper>
  );
};

export default AccountTransactionList;