import React from 'react';
import { Container, Alert, Snackbar, Box, Paper, Typography, Button } from '@mui/material';
import { useAppSelector } from '../../../../hooks/redux';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// 導入自定義 hook
import { useTransactionEditPage } from '../hooks/useTransactionEditPage';

// 導入子組件
import TransactionPageForm from '../../pages/TransactionPage/components/TransactionPageForm';

/**
 * 會計系統交易編輯頁面
 * 專門用於編輯交易的獨立頁面
 */
export const TransactionEditPage: React.FC = () => {
  // 使用自定義 hook 獲取頁面狀態和事件處理函數
  const {
    // 狀態
    editingTransaction,
    loading,
    error,
    snackbar,
    
    // 事件處理函數
    handleFormSubmit,
    handleCancel,
    handleCloseSnackbar,
  } = useTransactionEditPage();

  // 獲取帳戶和組織數據
  const { accounts } = useAppSelector(state => state.account2);
  const { organizations } = useAppSelector(state => state.organization);

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: 2 }}>
      {/* 頁面標題 */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleCancel}
              sx={{ mr: 2 }}
            >
              返回
            </Button>
            <Typography variant="h5">編輯交易</Typography>
          </Box>
        </Box>
      </Paper>

      {/* 載入中提示 */}
      {loading && !editingTransaction && (
        <Alert severity="info" sx={{ mb: 3 }}>
          正在載入交易資料...
        </Alert>
      )}

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 交易表單 */}
      {editingTransaction && (
        <TransactionPageForm
          onCancel={handleCancel}
          onSubmit={handleFormSubmit}
          editingTransaction={editingTransaction}
          copyingTransaction={null}
          accounts={accounts}
          organizations={organizations}
          defaultAccountId={null}
          defaultOrganizationId={null}
        />
      )}

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

export default TransactionEditPage;