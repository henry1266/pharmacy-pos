import React from 'react';
import {
  Box,
  Typography,
  Chip
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
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

interface TransactionFlowDisplayProps {
  transaction: ExtendedTransactionGroupWithEntries;
}

// 可重用的 Chip 樣式配置
const FLOW_CHIP_STYLES = {
  fontSize: '0.75rem',
  height: 24,
  maxWidth: 80,
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.75rem'
  }
} as const;

// 可重用的流向 Chip 組件
const FlowChip: React.FC<{
  label: string;
  color: 'primary' | 'secondary';
  position: 'from' | 'to';
}> = ({ label, color, position }) => (
  <Chip
    label={label}
    size="small"
    color={color}
    sx={{
      ...FLOW_CHIP_STYLES,
      ...(position === 'from' ? { mr: 0.5 } : { ml: 0.5 })
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
export const TransactionFlowDisplay: React.FC<TransactionFlowDisplayProps> = ({
  transaction
}) => {
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
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, minWidth: 180 }}>
        <FlowChip
          label={fromAccountName}
          color="secondary"
          position="from"
        />
        <ArrowForwardIcon sx={{ fontSize: 16, color: 'primary.main', mx: 0.25 }} />
        <FlowChip
          label={toAccountName}
          color="primary"
          position="to"
        />
      </Box>
    );
  };

  return renderTransactionFlow();
};

export default TransactionFlowDisplay;