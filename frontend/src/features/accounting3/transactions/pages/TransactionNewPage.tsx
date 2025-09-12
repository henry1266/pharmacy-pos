import React from 'react';
import { Container, Alert, Box, Snackbar } from '@mui/material';
import { useAppSelector } from '../../../../hooks/redux';

// 導入自定義 hook
import { useTransactionNewPage } from '../../pages/TransactionPage/hooks/useTransactionNewPage';

// 導入子組件
import PageHeader from '../../pages/TransactionPage/components/PageHeader';
import TransactionPageForm from '../../pages/TransactionPage/components/TransactionPageForm';

/**
 * 會計系統交易新增頁面
 * 專門用於新增交易
 */
export const TransactionNewPage: React.FC = () => {
  // 使用自定義 hook 獲取頁面狀態和事件處理函數
  const {
    // 狀態
    loading,
    error,
    snackbar,
    
    // URL 參數
    defaultAccountId,
    defaultOrganizationId,
    
    // 事件處理函數
    handleFormSubmit,
    handleCancel,
    handleCloseSnackbar,
    
    // 導航
    navigate
  } = useTransactionNewPage();

  // 獲取帳戶和組織數據
  const { accounts } = useAppSelector(state => state.account2);
  const { organizations } = useAppSelector(state => state.organization);

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: 2 }}>
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

      {/* 載入中提示 */}
      {loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          正在載入資料...
        </Alert>
      )}

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 新增交易表單 */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <TransactionPageForm
          onCancel={handleCancel}
          onSubmit={handleFormSubmit}
          editingTransaction={null}
          copyingTransaction={null}
          accounts={accounts}
          organizations={organizations}
          defaultAccountId={defaultAccountId}
          defaultOrganizationId={defaultOrganizationId}
        />
      </Box>

      {/* 通知 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TransactionNewPage;