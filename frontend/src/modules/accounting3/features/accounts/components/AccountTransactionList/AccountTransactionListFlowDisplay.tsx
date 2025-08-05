import React from 'react';
import {
  Box,
  Typography,
  Chip
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TransactionGroupWithEntries } from '@pharmacy-pos/shared/types/accounting2';

// 共享型別定義 - 應該提取到共享文件中
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
}

interface AccountTransactionListFlowDisplayProps {
  transaction: ExtendedTransactionGroupWithEntries;
}

// 可重用的 Chip 樣式配置 - 觸控優化版本
const FLOW_CHIP_STYLES = {
  fontSize: { xs: '0.75rem', sm: '0.8rem' },
  height: { xs: 24, sm: 28 },
  maxWidth: { xs: 100, sm: 120 },
  px: 0.5,
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: { xs: '0.75rem', sm: '0.8rem' },
    px: 0.5
  }
} as const;

// 可重用的流向 Chip 組件 - 觸控優化版本
const FlowChip: React.FC<{
  label: string;
  color: 'primary' | 'secondary';
  position: 'from' | 'to';
  accountId?: string | any;
  onClick?: (accountId: string | any) => void;
}> = ({ label, color, position, accountId, onClick }) => (
  <Chip
    label={label}
    size="medium"
    color={color}
    clickable={!!accountId}
    onClick={accountId && onClick ? () => onClick(accountId) : undefined}
    sx={{
      ...FLOW_CHIP_STYLES,
      ...(position === 'from' ? { mr: { xs: 0.5, sm: 1 } } : { ml: { xs: 0.5, sm: 1 } }),
      cursor: accountId ? 'pointer' : 'default',
      boxShadow: 1,
      transition: 'all 0.2s',
      '&:hover': accountId ? {
        backgroundColor: color === 'primary' ? 'primary.dark' : 'secondary.dark',
        boxShadow: 2,
        transform: 'translateY(-1px)'
      } : {},
      '&:active': accountId ? {
        transform: 'translateY(0)',
        boxShadow: 0
      } : {}
    }}
  />
);

// 工具函數 - 提取到組件外部
const hasValidEntries = (entries: any[]): boolean => {
  return entries && entries.length >= 2;
};

const getAccountEntries = (entries: any[]) => {
  const debitEntries = entries.filter(entry => (entry.debitAmount || 0) > 0);
  const creditEntries = entries.filter(entry => (entry.creditAmount || 0) > 0);
  return { debitEntries, creditEntries };
};

const getAccountName = (account: any): string => {
  return account?.accountName || '未知科目';
};

/**
 * 交易流向顯示組件
 * 顯示交易的借貸方向和科目流向
 */
export const AccountTransactionListFlowDisplay: React.FC<AccountTransactionListFlowDisplayProps> = ({
  transaction
}) => {
  const navigate = useNavigate();

  // 提取帳戶ID的工具函數
  const extractAccountId = (accountId: string | any): string | null => {
    if (typeof accountId === 'string') {
      return accountId;
    }
    if (typeof accountId === 'object' && accountId?._id) {
      return accountId._id;
    }
    return null;
  };

  // 處理帳戶點擊事件
  const handleAccountClick = (accountId: string | any) => {
    const cleanId = extractAccountId(accountId);
    if (cleanId) {
      navigate(`/accounting3/accounts/${cleanId}`);
    }
  };

  // 渲染交易流向圖
  const renderTransactionFlow = () => {
    // 早期返回 - 無效的分錄資料
    if (!hasValidEntries(transaction.entries)) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    const { debitEntries, creditEntries } = getAccountEntries(transaction.entries);

    // 早期返回 - 缺少借方或貸方分錄
    if (debitEntries.length === 0 || creditEntries.length === 0) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 取第一個借方和貸方科目作為代表
    const fromAccount = creditEntries[0];
    const toAccount = debitEntries[0];

    const fromAccountName = getAccountName(fromAccount);
    const toAccountName = getAccountName(toAccount);

    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        py: { xs: 0.5, sm: 1 },
        minWidth: { xs: 180, sm: 220 },
        maxWidth: '100%',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <FlowChip
          label={fromAccountName}
          color="secondary"
          position="from"
          accountId={fromAccount.accountId}
          onClick={handleAccountClick}
        />
        <ArrowForwardIcon sx={{
          fontSize: { xs: 16, sm: 20 },
          color: 'primary.main',
          mx: { xs: 0.25, sm: 0.5 },
          animation: 'pulse 1.5s infinite ease-in-out',
          '@keyframes pulse': {
            '0%': { opacity: 0.7, transform: 'scale(0.95)' },
            '50%': { opacity: 1, transform: 'scale(1.05)' },
            '100%': { opacity: 0.7, transform: 'scale(0.95)' }
          }
        }} />
        <FlowChip
          label={toAccountName}
          color="primary"
          position="to"
          accountId={toAccount.accountId}
          onClick={handleAccountClick}
        />
      </Box>
    );
  };

  return renderTransactionFlow();
};

export default AccountTransactionListFlowDisplay;