import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert } from '@mui/material';

// 導入交易詳細檢視組件
import { TransactionDetailView } from '../components/TransactionDetailView';

/**
 * 交易詳細頁面
 *
 * 用於顯示單一交易的完整資訊，包括交易基本資料、分錄明細和資金流向。
 * 此頁面對應 /accounting3/transaction/:transactionId 路由，顯示指定 ID 的交易詳情。
 *
 * 頁面功能：
 * - 顯示交易的基本資訊（日期、描述、金額等）
 * - 顯示交易的分錄明細
 * - 顯示交易的資金流向
 * - 提供編輯、複製和刪除交易的功能
 *
 * @component
 * @param {object} props - 元件屬性
 * @example
 * // 在 AppRouter.tsx 中使用
 * <Route path="/accounting3/transaction/:transactionId" element={<TransactionDetailPage />} />
 */
const TransactionDetailPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();

  // 檢查是否有交易ID
  if (!transactionId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          無效的交易ID
        </Alert>
      </Container>
    );
  }

  // 處理編輯交易
  const handleEdit = () => {
    navigate(`/accounting3/transaction/${transactionId}/edit`);
  };

  // 處理複製交易
  const handleCopy = () => {
    navigate(`/accounting3/transaction/${transactionId}/copy`);
  };

  // 處理刪除交易
  const handleDelete = () => {
    // 刪除後返回交易列表
    navigate('/accounting3/transaction');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <TransactionDetailView
        transactionId={transactionId}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={handleDelete}
        showActions={true}
      />
    </Container>
  );
};

export default TransactionDetailPage;