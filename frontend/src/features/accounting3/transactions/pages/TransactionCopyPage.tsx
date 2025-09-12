import React from 'react';
import { Container, Alert, Box, Snackbar } from '@mui/material';
import { useAppSelector } from '../../../../hooks/redux';

// 導入自定義 hook
import { useTransactionCopyPage } from '../../pages/TransactionPage/hooks/useTransactionCopyPage';

// 導入子組件
import PageHeader from '../../pages/TransactionPage/components/PageHeader';
import TransactionPageForm from '../../pages/TransactionPage/components/TransactionPageForm';

/**
 * 會計系統交易複製頁面
 * 專門用於複製交易
 */
export const TransactionCopyPage: React.FC = () => {
  // 使用自定義 hook 獲取頁面狀態和事件處理函數
  const {
    // 狀態
    copyingTransaction,
    loading,
    error,
    snackbar,
    
    // URL 參數
    
    // 事件處理函數
    handleFormSubmit,
    handleCancel,
    handleCloseSnackbar,
    
    // 導航
    navigate
  } = useTransactionCopyPage();

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
      {loading && !copyingTransaction && (
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

      {/* 複製交易表單 */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <TransactionPageForm
          onCancel={handleCancel}
          onSubmit={handleFormSubmit}
          editingTransaction={null}
          copyingTransaction={copyingTransaction}
          accounts={accounts}
          organizations={organizations}
          defaultAccountId={null}
          defaultOrganizationId={null}
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

export default TransactionCopyPage;