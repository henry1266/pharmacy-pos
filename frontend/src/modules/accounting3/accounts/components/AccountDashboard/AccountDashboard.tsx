import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Account2, TransactionGroupWithEntries } from '@pharmacy-pos/shared/types/accounting2';
import { accounting3Service } from '../../../services/accounting3Service';
import { AccountDashboardStatisticsCards as StatisticsCards } from './AccountDashboardStatisticsCards';
import { AccountDashboardTransactionOverview as TransactionOverview } from './AccountDashboardTransactionOverview';
import { AccountDashboardStatusDistribution as StatusDistribution } from './AccountDashboardStatusDistribution';
import { AccountDashboardMonthlyTrend as MonthlyTrend } from './AccountDashboardMonthlyTrend';

interface AccountDashboardProps {
  selectedAccount: Account2;
}

interface AccountStatistics {
  totalTransactions: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  netAmount: number;
  averageTransactionAmount: number;
  lastTransactionDate: Date | null;
  firstTransactionDate: Date | null;
  monthlyTrend: Array<{
    month: string;
    debitAmount: number;
    creditAmount: number;
    netAmount: number;
    transactionCount: number;
  }>;
  statusDistribution: {
    draft: number;
    confirmed: number;
    cancelled: number;
  };
}

/**
 * 科目統計儀表板組件
 * 顯示選中科目的詳細統計資訊和趨勢分析
 */
export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  selectedAccount
}) => {
  const [statistics, setStatistics] = useState<AccountStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入科目統計資料
  useEffect(() => {
    if (selectedAccount) {
      loadAccountStatistics();
    }
  }, [selectedAccount]);

  const loadAccountStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('載入科目統計:', selectedAccount._id);
      
      // 載入科目的所有交易
      const response = await accounting3Service.transactions.getByAccount(selectedAccount._id, {
        limit: 10000,
        page: 1
      });
      
      if (response.success && response.data) {
        const transactions = response.data;
        const stats = calculateStatistics(transactions, selectedAccount._id);
        setStatistics(stats);
      } else {
        setError('載入統計資料失敗');
      }
    } catch (err) {
      console.error('載入科目統計失敗:', err);
      setError('載入統計資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 計算統計資料
  const calculateStatistics = (
    transactions: TransactionGroupWithEntries[],
    accountId: string
  ): AccountStatistics => {
    let totalDebitAmount = 0;
    let totalCreditAmount = 0;
    let lastTransactionDate: Date | null = null;
    let firstTransactionDate: Date | null = null;
    const monthlyData = new Map<string, {
      debitAmount: number;
      creditAmount: number;
      transactionCount: number;
    }>();
    const statusDistribution = { draft: 0, confirmed: 0, cancelled: 0 };

    transactions.forEach(transaction => {
      if (!transaction.entries) return;
      
      const accountEntry = transaction.entries.find(entry =>
        (entry as any).accountId === accountId || (entry as any).account === accountId
      );
      
      if (accountEntry) {
        totalDebitAmount += accountEntry.debitAmount || 0;
        totalCreditAmount += accountEntry.creditAmount || 0;
        
        // 更新日期範圍
        const transactionDate = new Date(transaction.transactionDate);
        if (!lastTransactionDate || transactionDate > lastTransactionDate) {
          lastTransactionDate = transactionDate;
        }
        if (!firstTransactionDate || transactionDate < firstTransactionDate) {
          firstTransactionDate = transactionDate;
        }
        
        // 月度統計
        const monthKey = transactionDate.toISOString().substring(0, 7); // YYYY-MM
        const monthData = monthlyData.get(monthKey) || {
          debitAmount: 0,
          creditAmount: 0,
          transactionCount: 0
        };
        monthData.debitAmount += accountEntry.debitAmount || 0;
        monthData.creditAmount += accountEntry.creditAmount || 0;
        monthData.transactionCount += 1;
        monthlyData.set(monthKey, monthData);
        
        // 狀態分佈
        if (transaction.status === 'draft') statusDistribution.draft += 1;
        else if (transaction.status === 'confirmed') statusDistribution.confirmed += 1;
        else if (transaction.status === 'cancelled') statusDistribution.cancelled += 1;
      }
    });

    // 根據科目類型計算淨額
    let netAmount = 0;
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
    const averageTransactionAmount = transactions.length > 0 ? Math.abs(netAmount) / transactions.length : 0;

    // 轉換月度資料為陣列並排序
    const monthlyTrend = Array.from(monthlyData.entries())
      .map(([month, data]) => {
        // 根據科目類型計算月度淨額
        let monthlyNetAmount = 0;
        if (accountType === 'asset' || accountType === 'expense') {
          monthlyNetAmount = data.debitAmount - data.creditAmount;
        } else if (accountType === 'liability' || accountType === 'equity' || accountType === 'revenue') {
          monthlyNetAmount = data.creditAmount - data.debitAmount;
        } else {
          monthlyNetAmount = data.debitAmount - data.creditAmount;
        }
        
        return {
          month,
          debitAmount: data.debitAmount,
          creditAmount: data.creditAmount,
          netAmount: monthlyNetAmount,
          transactionCount: data.transactionCount
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalTransactions: transactions.length,
      totalDebitAmount,
      totalCreditAmount,
      netAmount,
      averageTransactionAmount,
      lastTransactionDate,
      firstTransactionDate,
      monthlyTrend,
      statusDistribution
    };
  };

  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString('zh-TW');
  };

  // 計算趨勢百分比
  const calculateTrendPercentage = () => {
    if (!statistics || statistics.monthlyTrend.length < 2) return null;
    
    const lastMonth = statistics.monthlyTrend[statistics.monthlyTrend.length - 1];
    const previousMonth = statistics.monthlyTrend[statistics.monthlyTrend.length - 2];
    
    if (!previousMonth || !lastMonth || previousMonth.netAmount === 0) return null;
    
    const percentage = ((lastMonth.netAmount - previousMonth.netAmount) / Math.abs(previousMonth.netAmount)) * 100;
    return percentage;
  };

  const trendPercentage = calculateTrendPercentage();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        暫無統計資料
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* 主要統計卡片 */}
      <StatisticsCards
        totalTransactions={statistics.totalTransactions}
        totalDebitAmount={statistics.totalDebitAmount}
        totalCreditAmount={statistics.totalCreditAmount}
        netAmount={statistics.netAmount}
        trendPercentage={trendPercentage}
        formatCurrency={formatCurrency}
      />

      {/* 詳細資訊區域 */}
      <Grid container spacing={3}>
        {/* 交易概覽 */}
        <TransactionOverview
          averageTransactionAmount={statistics.averageTransactionAmount}
          lastTransactionDate={statistics.lastTransactionDate}
          firstTransactionDate={statistics.firstTransactionDate}
          monthlyTrendLength={statistics.monthlyTrend.length}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />

        {/* 狀態分佈 */}
        <StatusDistribution
          statusDistribution={statistics.statusDistribution}
          totalTransactions={statistics.totalTransactions}
        />

        {/* 月度趨勢 */}
        <MonthlyTrend
          monthlyTrend={statistics.monthlyTrend}
          formatCurrency={formatCurrency}
        />
      </Grid>
    </Box>
  );
};

export default AccountDashboard;