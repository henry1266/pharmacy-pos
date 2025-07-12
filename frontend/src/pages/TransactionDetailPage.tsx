import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert } from '@mui/material';

// 導入交易詳細檢視組件
import { TransactionDetailView } from '../modules/accounting3/components/features/transactions/TransactionDetailView';

/**
 * 交易詳細頁面
 * 用於顯示單一交易的完整資訊
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
    navigate('/accounting3');
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