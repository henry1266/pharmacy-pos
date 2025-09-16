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
import { useTransactionDetail, useTransactionActions } from '../hooks';

// 導入子組件
import {TransactionFundingFlow} from './';
import {TransactionActions} from './TransactionActions';
import {TransactionBasicInfo} from './TransactionBasicInfo';
import {TransactionBreadcrumbs} from './TransactionBreadcrumbs';
interface TransactionDetailViewProps {
  transactionId: string;
  onEdit?: (transaction: TransactionGroupWithEntries3) => void;
  onDelete?: (transactionId: string) => void;
  onCopy?: (transaction: TransactionGroupWithEntries3) => void;
  showActions?: boolean;
}

/**
 * 交易詳細檢視組件
 *
 * 顯示單一交易的完整資訊，包括基本資訊、分錄明細和資金流向。
 * 此組件是交易詳情頁面的核心顯示元件，負責呈現交易的所有相關資訊。
 *
 * 功能：
 * - 顯示交易的基本資訊（日期、描述、金額等）
 * - 顯示交易的分錄明細
 * - 顯示交易的資金流向
 * - 提供編輯、複製和刪除交易的操作按鈕
 *
 * @component
 * @param {object} props - 元件屬性
 * @param {string} props.transactionId - 要顯示的交易 ID
 * @param {function} [props.onEdit] - 編輯交易的回調函數
 * @param {function} [props.onDelete] - 刪除交易的回調函數
 * @param {function} [props.onCopy] - 複製交易的回調函數
 * @param {boolean} [props.showActions=true] - 是否顯示操作按鈕
 * @returns {React.ReactElement} 交易詳情視圖元件
 *
 * @example
 * // 基本用法
 * <TransactionDetailView
 *   transactionId="60f1e5b3e6b1f83b3c7a1b5a"
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onCopy={handleCopy}
 * />
 *
 * // 不顯示操作按鈕
 * <TransactionDetailView
 *   transactionId="60f1e5b3e6b1f83b3c7a1b5a"
 *   showActions={false}
 * />
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
    transaction: transaction || null,
    ...(onEdit && { onEdit }),
    ...(onDelete && { onDelete }),
    ...(onCopy && { onCopy })
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
        <Typography variant="h4" component="h1" gutterBottom>
          交易詳情
        </Typography>
        
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