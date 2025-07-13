import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Account2, ACCOUNT_TYPES } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { accountApiClient, useErrorHandler, useNotification } from '../../../core';
import { useAccountStore } from '../../../core/stores/useAccountStore';
import organizationService from '@services/organizationService';
//import AccountForm from './AccountForm';

interface AccountListProps {
  onAddAccount?: () => void;
  organizationId?: string | null;
  refreshTrigger?: number;
}

const AccountList: React.FC<AccountListProps> = ({ onAddAccount, organizationId, refreshTrigger }) => {
  // 整合狀態管理
  const { accounts: storeAccounts, loadAccounts: loadAccountsFromStore } = useAccountStore();
  
  // 錯誤處理和通知
  const { handleError, clearError } = useErrorHandler();
  const { showSuccess, showError } = useNotification();
  
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account2 | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account2 | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    console.log('AccountList useEffect 觸發 - organizationId:', organizationId, 'refreshTrigger:', refreshTrigger);
    loadAccounts();
    loadOrganizations();
  }, [organizationId, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAccounts = useCallback(async () => {
    try {
      console.log('開始載入帳戶列表 - organizationId:', organizationId);
      setLoading(true);
      clearError();
      
      // 使用新的 AccountApiClient
      const response = await accountApiClient.getAccounts({ organizationId: organizationId || undefined });
      console.log('API 回應:', response);
      
      if (response.success && response.data) {
        console.log('載入帳戶成功，帳戶數量:', response.data.length);
        setAccounts(response.data);
        
        // 同步更新狀態管理
        await loadAccountsFromStore();
      } else {
        console.error('API 回應失敗:', response);
        showError('載入帳戶列表失敗');
      }
    } catch (error) {
      console.error('載入帳戶列表錯誤:', error);
      handleError(error, { operation: 'loadAccounts', organizationId });
    } finally {
      setLoading(false);
    }
  }, [organizationId, clearError, showError, handleError, loadAccountsFromStore]);

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await organizationService.getOrganizations();
      if (response.success) {
        setOrganizations(response.data);
      }
    } catch (error) {
      console.error('載入機構列表錯誤:', error);
      handleError(error, { operation: 'loadOrganizations' });
    }
  }, [handleError]);

  const handleCreate = () => {
    setSelectedAccount(undefined);
    setFormOpen(true);
    onAddAccount?.();
  };

  const handleEdit = (account: Account2) => {
    setSelectedAccount(account);
    setFormOpen(true);
  };

  const handleDelete = (account: Account2) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = useCallback(async () => {
    if (!accountToDelete) return;

    try {
      setSubmitLoading(true);
      
      // 使用新的 AccountApiClient 刪除帳戶
      const response = await accountApiClient.deleteAccount(accountToDelete._id);
      if (response.success) {
        await loadAccounts();
        setDeleteDialogOpen(false);
        setAccountToDelete(null);
        showSuccess(`帳戶「${accountToDelete.name}」已成功刪除`);
      } else {
        showError('刪除帳戶失敗');
      }
    } catch (error) {
      console.error('刪除帳戶錯誤:', error);
      handleError(error, {
        operation: 'deleteAccount',
        accountId: accountToDelete._id,
        accountName: accountToDelete.name
      });
    } finally {
      setSubmitLoading(false);
    }
  }, [accountToDelete, loadAccounts, showSuccess, showError, handleError]);

  const handleFormSubmit = useCallback(async (formData: any) => {
    try {
      setSubmitLoading(true);
      
      // 使用新的 AccountApiClient 進行更新或創建
      if (selectedAccount) {
        await accountApiClient.updateAccount(selectedAccount._id, formData);
        showSuccess(`帳戶「${formData.name || selectedAccount.name}」已成功更新`);
      } else {
        await accountApiClient.createAccount(formData);
        showSuccess(`帳戶「${formData.name}」已成功建立`);
      }
      
      await loadAccounts();
      setFormOpen(false);
      setSelectedAccount(undefined);
    } catch (error) {
      console.error('提交表單錯誤:', error);
      handleError(error, {
        operation: selectedAccount ? 'updateAccount' : 'createAccount',
        accountData: formData
      });
    } finally {
      setSubmitLoading(false);
    }
  }, [selectedAccount, loadAccounts, showSuccess, handleError]);

  // 使用 useMemo 優化計算
  const getAccountTypeLabel = useCallback((type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    return accountType ? accountType.label : type;
  }, []);

  const getAccountTypeColor = useCallback((type: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      cash: 'success',
      bank: 'primary',
      credit: 'warning',
      investment: 'info',
      other: 'default'
    };
    return colors[type] || 'default';
  }, []);

  const formatBalance = useCallback((balance: number, currency: string) => {
    return `${currency} ${balance.toLocaleString()}`;
  }, []);

  // 計算統計資料
  const accountStats = useMemo(() => {
    const totalCount = accounts.length;
    const twdBalance = accounts
      .filter(acc => acc.currency === 'TWD')
      .reduce((sum, acc) => sum + acc.balance, 0);
    
    return { totalCount, twdBalance };
  }, [accounts]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* 標題和新增按鈕 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          帳戶管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          新增帳戶
        </Button>
      </Box>

      {/* 帳戶統計卡片 */}
      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              總帳戶數
            </Typography>
            <Typography variant="h4">
              {accountStats.totalCount}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              總餘額 (TWD)
            </Typography>
            <Typography variant="h4">
              {accountStats.twdBalance.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 帳戶列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>帳戶名稱</TableCell>
              <TableCell>類型</TableCell>
              <TableCell align="right">餘額</TableCell>
              <TableCell align="right">初始餘額</TableCell>
              <TableCell>描述</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">
                    尚無帳戶資料，請新增第一個帳戶
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2">
                        {account.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getAccountTypeLabel(account.type)}
                      color={getAccountTypeColor(account.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={account.balance >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {formatBalance(account.balance, account.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="textSecondary">
                      {formatBalance(account.initialBalance, account.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {account.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="檢視詳情">
                      <IconButton size="small" color="info">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編輯">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(account)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="刪除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(account)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>


      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定要刪除帳戶「{accountToDelete?.name}」嗎？此操作無法復原。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitLoading}>
            取消
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={submitLoading}
          >
            {submitLoading ? '刪除中...' : '確認刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 使用 React.memo 優化組件重新渲染
export default React.memo(AccountList);