import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  Divider,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../hooks/redux';

// 導入相關組件
import { AccountTransactionList } from '../modules/accounting3/features/accounts/components';
import {
  fetchAccounts2,
  confirmTransactionGroupWithEntries,
  unlockTransactionGroupWithEntries,
  deleteTransactionGroupWithEntries,
  fetchTransactionGroupsWithEntries
} from '../redux/actions';

// 導入類型
import { Account2, TransactionGroupWithEntries } from '../../../shared/types/accounting2';

interface AccountDetailPageProps {}

export const AccountDetailPage: React.FC<AccountDetailPageProps> = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const { accounts } = useAppSelector(state => state.account2);
  
  // Local state
  const [currentAccount, setCurrentAccount] = useState<Account2 | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入科目資料
  useEffect(() => {
    if (accounts.length === 0) {
      dispatch(fetchAccounts2() as any);
    }
  }, [dispatch, accounts.length]);

  // 找到當前科目
  useEffect(() => {
    if (accountId && accounts.length > 0) {
      const account = accounts.find(acc => acc._id === accountId);
      setCurrentAccount(account || null);
      
      if (!account) {
        showSnackbar('找不到指定的科目', 'error');
      }
    }
  }, [accountId, accounts]);

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 關閉通知
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 處理新增交易
  const handleAddTransaction = () => {
    const returnTo = encodeURIComponent(`/accounting3/accounts/${accountId}`);
    navigate(`/accounting3/transaction/new?defaultAccountId=${accountId}&returnTo=${returnTo}`);
  };

  // 處理查看交易
  const handleTransactionView = (transaction: TransactionGroupWithEntries) => {
    navigate(`/accounting3/transaction/${transaction._id}`);
  };

  // 處理編輯交易
  const handleTransactionEdit = (transaction: TransactionGroupWithEntries) => {
    const returnTo = encodeURIComponent(`/accounting3/accounts/${accountId}`);
    navigate(`/accounting3/transaction/${transaction._id}/edit?returnTo=${returnTo}`);
  };

  // 處理確認交易
  const handleTransactionConfirm = async (transactionId: string) => {
    try {
      await dispatch(confirmTransactionGroupWithEntries(transactionId) as any);
      showSnackbar('交易已確認', 'success');
      // 重新載入交易資料
      dispatch(fetchTransactionGroupsWithEntries() as any);
    } catch (error) {
      console.error('確認交易失敗:', error);
      showSnackbar('確認交易失敗', 'error');
    }
  };

  // 處理解鎖交易
  const handleTransactionUnlock = async (transactionId: string) => {
    try {
      await dispatch(unlockTransactionGroupWithEntries(transactionId) as any);
      showSnackbar('交易已解鎖', 'success');
      // 重新載入交易資料
      dispatch(fetchTransactionGroupsWithEntries() as any);
    } catch (error) {
      console.error('解鎖交易失敗:', error);
      showSnackbar('解鎖交易失敗', 'error');
    }
  };

  // 處理刪除交易
  const handleTransactionDelete = async (transactionId: string) => {
    if (window.confirm(`確定要刪除此交易嗎？此操作無法復原。`)) {
      try {
        await dispatch(deleteTransactionGroupWithEntries(transactionId) as any);
        showSnackbar('交易已刪除', 'success');
        // 重新載入交易資料
        dispatch(fetchTransactionGroupsWithEntries() as any);
      } catch (error) {
        console.error('刪除交易失敗:', error);
        showSnackbar('刪除交易失敗', 'error');
      }
    }
  };

  // 處理複製交易
  const handleTransactionCopy = (transaction: TransactionGroupWithEntries) => {
    const returnTo = encodeURIComponent(`/accounting3/accounts/${accountId}`);
    navigate(`/accounting3/transaction/${transaction._id}/copy?returnTo=${returnTo}`);
  };

  if (!currentAccount) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          {accounts.length === 0 ? '載入科目資料中...' : '找不到指定的科目'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      {/* 頁面標題 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            科目詳情
          </Typography>
        </Box>
      </Box>

      {/* 麵包屑導航 */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/accounting3');
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ReceiptIcon fontSize="small" />
            會計管理
          </Link>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/accounting3/accounts');
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <AccountBalanceIcon fontSize="small" />
            科目管理
          </Link>
          <Typography
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {currentAccount.name}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* 交易明細 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            交易明細
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <AccountTransactionList
            selectedAccount={currentAccount}
            onTransactionView={handleTransactionView}
            onTransactionEdit={handleTransactionEdit}
            onTransactionConfirm={handleTransactionConfirm}
            onTransactionUnlock={handleTransactionUnlock}
            onTransactionDelete={handleTransactionDelete}
            onTransactionCopy={handleTransactionCopy}
            onAddTransaction={handleAddTransaction}
          />
        </CardContent>
      </Card>

      {/* 右側固定按鈕 */}
      <Box
        sx={{
          position: 'fixed',
          right: 5,
          top: '40%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
      >
        <Tooltip title="新增交易" placement="left" arrow>
          <Fab color="primary" size="medium" onClick={handleAddTransaction} aria-label="新增交易">
            <AddIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="返回科目列表" placement="left" arrow>
          <Fab color="secondary" size="medium" onClick={() => navigate('/accounting3/accounts')} aria-label="返回科目列表">
            <ArrowBackIcon />
          </Fab>
        </Tooltip>
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

export default AccountDetailPage;