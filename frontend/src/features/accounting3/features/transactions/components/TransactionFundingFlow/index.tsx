import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  Box,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatAmount } from '../../utils/transactionUtils';
import { TransactionFundingFlowProps } from './types';
import { useTransactionBalance } from './hooks/useTransactionBalance';
import { useTransactionCalculations } from './hooks/useTransactionCalculations';
import SourceSection from './components/sections/SourceSection';
import FlowToSection from './components/sections/FlowToSection';
import PaymentFlowSection from './components/sections/PaymentFlowSection';
import PayableStatusSection from './components/sections/PayableStatusSection';
import FlowChip from './components/ui/FlowChip';

/**
 * 交易資金流向追蹤組件
 * 顯示交易的資金來源、流向和相關資訊
 */
const TransactionFundingFlow: React.FC<TransactionFundingFlowProps> = ({
  transaction
}) => {
  const navigate = useNavigate();
  const { linkedTransactionDetails, loading } = useTransactionBalance(transaction);
  const {
    extractAccountId,
    hasMultipleSources,
    calculateUsedAmount,
    calculateBalanceInfo,
    calculateFlowTotal,
  } = useTransactionCalculations(transaction, linkedTransactionDetails);

  // 處理帳戶點擊事件
  const handleAccountClick = (accountId: string | any) => {
    const cleanId = extractAccountId(accountId);
    if (cleanId) {
      navigate(`/accounting3/accounts/${cleanId}`);
    }
  };

  // 渲染交易流向圖
  const renderTransactionFlow = () => {
    if (!transaction.entries || transaction.entries.length < 2) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 找到主要的借方和貸方科目
    const debitEntries = transaction.entries.filter(entry => (entry.debitAmount || 0) > 0);
    const creditEntries = transaction.entries.filter(entry => (entry.creditAmount || 0) > 0);

    if (debitEntries.length === 0 || creditEntries.length === 0) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 取第一個借方和貸方科目作為代表
    const fromAccount = creditEntries[0];
    const toAccount = debitEntries[0];

    // 獲取科目名稱
    const fromAccountName = (fromAccount as any).accountName || '未知科目';
    const toAccountName = (toAccount as any).accountName || '未知科目';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, minWidth: 180 }}>
        <FlowChip
          label={fromAccountName}
          color="secondary"
          margin="0 0.5rem 0 0"
          accountId={fromAccount?.accountId || ''}
          handleAccountClick={handleAccountClick}
        />
        <FlowChip
          label={toAccountName}
          color="primary"
          margin="0 0 0 0.5rem"
          accountId={toAccount?.accountId || ''}
          handleAccountClick={handleAccountClick}
        />
      </Box>
    );
  };

  // 調試：檢查交易的完整結構
  console.log('🔍 TransactionFundingFlow 渲染，交易資訊:', {
    id: transaction._id,
    hasSourceTransaction: !!transaction.sourceTransactionId,
    sourceTransactionType: typeof transaction.sourceTransactionId,
    sourceTransactionId: transaction.sourceTransactionId,
    linkedTransactionIds: transaction.linkedTransactionIds,
    totalAmount: transaction.totalAmount,
    description: transaction.description,
    fullTransaction: transaction
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceIcon />
          資金流向追蹤
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {/* 付款交易特殊顯示 */}
        <PaymentFlowSection 
          transaction={transaction} 
          navigate={navigate} 
        />
        
        {/* 應付帳款狀態顯示 */}
        <PayableStatusSection 
          transaction={transaction} 
          navigate={navigate} 
        />

        {/* 兩欄式佈局 */}
        <Grid container spacing={2}>
          {/* 左欄：來源區塊 */}
          <Grid item xs={12} md={6}>
            <SourceSection
              transaction={transaction}
              navigate={navigate}
              calculateUsedAmount={calculateUsedAmount}
              calculateBalanceInfo={calculateBalanceInfo}
              loading={loading}
              linkedTransactionDetails={linkedTransactionDetails}
            />
          </Grid>
          
          {/* 右欄：流向區塊 */}
          <Grid item xs={12} md={6}>
            <FlowToSection
              transaction={transaction}
              navigate={navigate}
              loading={loading}
              linkedTransactionDetails={linkedTransactionDetails}
            />
          </Grid>
        </Grid>
        
        {/* 總計區域 - 水平對齊 */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {/* 來源總計 */}
          <Grid item xs={12} md={6}>
            {(transaction.sourceTransactionId || (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0)) && (
              <Box sx={{ pt: 2, pb: 2, borderTop: '1px solid #e0e0e0', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  來源總計：{formatAmount(transaction.totalAmount || 0)}
                </Typography>
              </Box>
            )}
          </Grid>
          
          {/* 流向總計 */}
          <Grid item xs={12} md={6}>
            {transaction.referencedByInfo && transaction.referencedByInfo.length > 0 && (
              <Box sx={{ pt: 2, pb: 2, borderTop: '1px solid #e0e0e0', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  流向總計：{formatAmount(calculateFlowTotal())}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TransactionFundingFlow;