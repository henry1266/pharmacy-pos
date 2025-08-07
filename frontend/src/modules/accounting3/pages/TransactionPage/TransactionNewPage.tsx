import React from 'react';
import { Container, Alert, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../../hooks/redux';

// 導入自定義 hook
import { useTransactionPage } from './hooks/useTransactionPage';

// 導入子組件
import PageHeader from './components/PageHeader';
import TransactionForm from './components/TransactionForm';

/**
 * 會計系統交易新增頁面
 * 專門用於新增交易
 */
export const TransactionNewPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 使用自定義 hook 獲取頁面狀態和事件處理函數
  const {
    // 狀態
    error,
    snackbar,
    
    // URL 參數
    defaultAccountId,
    defaultOrganizationId,
    
    // 事件處理函數
    handleFormSubmit,
    handleCloseSnackbar,
  } = useTransactionPage();

  // 獲取帳戶和組織數據
  const { accounts } = useAppSelector(state => state.account2);
  const { organizations } = useAppSelector(state => state.organization);

  return (
    <Container maxWidth="xl" sx={{ py: 0, px: 0 }}>
      {/* 頁面標題 */}
      <PageHeader
        mode="new"
        showFilters={false}
        searchTerm=""
        onSearchChange={() => {}}
        onToggleFilters={() => {}}
        onNavigateToNew={() => {}}
        onNavigateToList={() => navigate('/accounting3/transaction')}
      />

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 新增交易表單 */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <TransactionForm
          open={true}
          onClose={() => navigate('/accounting3/transaction')}
          onSubmit={async (formData) => {
            await handleFormSubmit(formData);
            navigate('/accounting3/transaction');
          }}
          editingTransaction={null}
          copyingTransaction={null}
          accounts={accounts}
          organizations={organizations}
          defaultAccountId={defaultAccountId}
          defaultOrganizationId={defaultOrganizationId}
        />
      </Box>
    </Container>
  );
};

export default TransactionNewPage;