import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { ExtendedTransactionGroupWithEntries } from '../types';

interface TransactionFlowProps {
  group: ExtendedTransactionGroupWithEntries;
  onAccountClick: (accountId: string | any) => void;
}

/**
 * 交易流向圖組件
 * 顯示交易的主要借方和貸方科目，以及它們之間的關係
 */
export const TransactionFlow: React.FC<TransactionFlowProps> = ({ group, onAccountClick }) => {
  if (!group.entries || group.entries.length < 2) {
    return <Typography variant="caption" color="text.disabled">-</Typography>;
  }

  // 找到主要的借方和貸方科目
  const debitEntries = group.entries.filter(entry => (entry.debitAmount || 0) > 0);
  const creditEntries = group.entries.filter(entry => (entry.creditAmount || 0) > 0);

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
      <Chip
        label={fromAccountName}
        size="medium"
        color="secondary"
        clickable
        onClick={() => fromAccount?.accountId && onAccountClick(fromAccount.accountId)}
        sx={{
          fontSize: '0.8rem',
          height: 28,
          mr: 0.5,
          maxWidth: 90,
          cursor: 'pointer',
          '& .MuiChip-label': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.8rem'
          },
          '&:hover': {
            backgroundColor: 'secondary.dark'
          }
        }}
      />
      <ArrowForwardIcon sx={{ fontSize: 18, color: 'primary.main', mx: 0.25 }} />
      <Chip
        label={toAccountName}
        size="medium"
        color="primary"
        clickable
        onClick={() => toAccount?.accountId && onAccountClick(toAccount?.accountId)}
        sx={{
          fontSize: '0.8rem',
          height: 28,
          ml: 0.5,
          maxWidth: 90,
          cursor: 'pointer',
          '& .MuiChip-label': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.8rem'
          },
          '&:hover': {
            backgroundColor: 'primary.dark'
          }
        }}
      />
    </Box>
  );
};

export default TransactionFlow;