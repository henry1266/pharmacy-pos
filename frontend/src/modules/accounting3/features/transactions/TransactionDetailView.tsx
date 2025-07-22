import React from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';

// 導入類型
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';

// 導入自定義 Hook
import { useTransactionDetail, useTransactionActions } from './hooks';

// 導入子組件
import {
  TransactionBreadcrumbs,
  TransactionActions,
  TransactionBasicInfo,
  TransactionFundingFlow,
} from './components';

interface TransactionDetailViewProps {
  transactionId: string;
  onEdit?: (transaction: TransactionGroupWithEntries3) => void;
  onDelete?: (transactionId: string) => void;
  onCopy?: (transaction: TransactionGroupWithEntries3) => void;
  showActions?: boolean;
}

/**
 * 交易詳細檢視組件
 * 顯示單一交易的完整資訊，包括基本資訊和所有分錄
 */
export const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({
  transactionId,
  onEdit,
  onDelete,
  onCopy,
  showActions = true
}) => {
  // 使用自定義 Hook
  const { transaction, accounts, loading, error } = useTransactionDetail(transactionId);
  const { handleEdit, handleCopy, handleDelete, handleBackToList } = useTransactionActions({
    transaction,
    onEdit,
    onDelete,
    onCopy
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
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

  if (!transaction) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        找不到交易資料
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* 麵包屑導航 */}
      <TransactionBreadcrumbs onNavigateToList={handleBackToList} />

      {/* 頁面標題和操作按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            交易詳情
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {transaction.groupNumber}
          </Typography>
        </Box>
        
        {showActions && (
          <TransactionActions
            onEdit={handleEdit}
            onCopy={handleCopy}
            onDelete={handleDelete}
            onBackToList={handleBackToList}
          />
        )}
      </Box>

      <Grid container spacing={3}>
        {/* 基本資訊卡片 */}
        <Grid item xs={12} md={3.5}>
          <TransactionBasicInfo transaction={transaction} />
        </Grid>

        {/* 資金流向追蹤卡片 */}
        <Grid item xs={12} md={8.5}>
          <TransactionFundingFlow transaction={transaction} />
        </Grid>

      </Grid>
    </Box>
  );
};

export default TransactionDetailView;