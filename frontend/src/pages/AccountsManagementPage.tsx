import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Snackbar,
  Paper,
  Breadcrumbs,
  Link,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

// 導入 accounting3 階層管理組件
import { AccountHierarchyManager } from '../modules/accounting3/components/features/accounts/AccountHierarchyManager';
import { AccountTransactionList } from '../modules/accounting3/components/features/accounts/AccountTransactionList';

// 導入 accounting2 科目表單組件
import { AccountForm } from '../modules/accounting2/components/features/accounts/AccountForm';

// 導入共享類型
import { Account2, Account2FormData } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';

// 導入服務
import { accounting3Service } from '../services/accounting3Service';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchOrganizations2 } from '../redux/actions';

/**
 * 科目管理頁面
 * 
 * 功能：
 * - 獨立的科目階層管理
 * - 科目的新增、編輯、刪除
 * - 科目階層的展開/收合
 * - 搜尋和過濾功能
 */
export const AccountsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Redux 狀態
  const { organizations } = useAppSelector(state => state.organization);
  
  // 本地狀態
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account2 | null>(null);
  const [parentAccount, setParentAccount] = useState<Account2 | null>(null); // 父科目資訊
  const [selectedAccount, setSelectedAccount] = useState<Account2 | null>(null); // 選中的科目
  const [formLoading, setFormLoading] = useState(false);
  const [hierarchyKey, setHierarchyKey] = useState(0); // 用於強制重新載入階層
  
  // 通知狀態
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入組織資料
  useEffect(() => {
    dispatch(fetchOrganizations2() as any);
  }, [dispatch]);

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 關閉通知
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 處理科目選擇
  const handleAccountSelect = (account: Account2) => {
    console.log('選擇科目:', account);
    setSelectedAccount(account);
  };

  // 處理新增科目
  const handleAccountCreate = (parentAccount?: Account2) => {
    console.log('新增科目', parentAccount ? `，父科目: ${parentAccount.name}` : '');
    setEditingAccount(null); // 新增時不設定 editingAccount
    setParentAccount(parentAccount || null); // 設定父科目資訊
    setAccountFormOpen(true);
  };

  // 處理新增子科目
  const handleAccountCreateChild = (parentAccountInfo: Account2) => {
    if (!parentAccountInfo) {
      console.error('新增子科目失敗：父科目資訊為空');
      showSnackbar('新增子科目失敗：父科目資訊不完整', 'error');
      return;
    }
    
    console.log('新增子科目，父科目:', parentAccountInfo.name);
    setEditingAccount(null); // 新增時不設定 editingAccount
    setParentAccount(parentAccountInfo); // 設定父科目資訊
    setAccountFormOpen(true);
  };

  // 處理編輯科目
  const handleAccountEdit = (account: Account2) => {
    console.log('編輯科目:', account);
    setEditingAccount(account);
    setAccountFormOpen(true);
  };

  // 處理刪除科目
  const handleAccountDelete = async (accountId: string) => {
    console.log('刪除科目:', accountId);
    if (window.confirm('確定要刪除這個科目嗎？此操作無法復原。')) {
      try {
        const response = await accounting3Service.accounts.delete(accountId);
        if (response.success) {
          showSnackbar('科目已成功刪除', 'success');
          // 強制重新載入階層
          setHierarchyKey(prev => prev + 1);
        } else {
          showSnackbar(response.message || '刪除科目失敗', 'error');
        }
      } catch (error) {
        console.error('刪除科目失敗:', error);
        showSnackbar('刪除科目失敗', 'error');
      }
    }
  };

  // 處理表單提交
  const handleFormSubmit = async (formData: Account2FormData) => {
    setFormLoading(true);
    try {
      if (editingAccount && editingAccount._id) {
        // 更新科目（只有當 editingAccount 有 _id 時才是編輯模式）
        const response = await accounting3Service.accounts.update(editingAccount._id, formData);
        if (response.success) {
          showSnackbar('科目已成功更新', 'success');
          setAccountFormOpen(false);
          setEditingAccount(null);
          setParentAccount(null);
          // 強制重新載入階層
          setHierarchyKey(prev => prev + 1);
        } else {
          showSnackbar('更新科目失敗', 'error');
        }
      } else {
        // 新增科目
        const response = await accounting3Service.accounts.create(formData);
        if (response.success) {
          showSnackbar('科目已成功建立', 'success');
          setAccountFormOpen(false);
          setParentAccount(null);
          // 強制重新載入階層
          setHierarchyKey(prev => prev + 1);
        } else {
          showSnackbar('建立科目失敗', 'error');
        }
      }
    } catch (error) {
      console.error('表單提交失敗:', error);
      showSnackbar((editingAccount && editingAccount._id) ? '更新科目失敗' : '建立科目失敗', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // 關閉表單
  const handleFormClose = () => {
    setAccountFormOpen(false);
    setEditingAccount(null);
    setParentAccount(null); // 清除父科目資訊
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* 麵包屑導航 */}
      <Box sx={{ mb: 2 }}>
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
          <Typography 
            color="text.primary" 
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <AccountTreeIcon fontSize="small" />
            科目管理
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* 頁面標題 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountTreeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            科目階層管理
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          管理會計科目的階層結構，包括新增、編輯、刪除科目以及調整階層關係
        </Typography>
      </Box>

      {/* 主要內容區域 - 左右布局 */}
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)', minHeight: 600 }}>
        {/* 左側：科目階層管理 */}
        <Paper sx={{ width: '40%', minWidth: 400 }}>
          <AccountHierarchyManager
            key={hierarchyKey}
            onAccountSelect={handleAccountSelect}
            onAccountCreate={handleAccountCreateChild}
            onAccountEdit={handleAccountEdit}
            onAccountDelete={handleAccountDelete}
            showToolbar={true}
            showSearch={true}
            showSettings={true}
            height="100%"
          />
        </Paper>

        {/* 右側：選中科目的交易內容 */}
        <Box sx={{ width: '60%', minWidth: 500 }}>
          <AccountTransactionList
            selectedAccount={selectedAccount}
            onTransactionView={(transaction) => {
              console.log('查看交易:', transaction);
              // 可以打開交易詳情對話框
            }}
            onTransactionEdit={(transaction) => {
              console.log('編輯交易:', transaction);
              // 導航到交易編輯頁面
              navigate(`/accounting3/transaction/${transaction._id}/edit`);
            }}
            onAddTransaction={(accountId) => {
              console.log('為科目新增交易:', accountId);
              // 導航到新增交易頁面，並預設選中的科目
              navigate(`/accounting3/new?defaultAccountId=${accountId}`);
            }}
          />
        </Box>
      </Box>

      {/* 右側固定按鈕 */}
      <Box
        sx={{
          position: 'fixed',
          right: 16,
          top: '40%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
      >
        <Tooltip title="返回交易管理" placement="left" arrow>
          <Fab 
            color="secondary" 
            size="medium" 
            onClick={() => navigate('/accounting3')} 
            aria-label="返回交易管理"
          >
            <ArrowBackIcon />
          </Fab>
        </Tooltip>
        
        <Tooltip title="新增科目" placement="left" arrow>
          <Fab
            color="primary"
            size="medium"
            onClick={() => handleAccountCreate()}
            aria-label="新增科目"
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* 科目表單對話框 */}
      <AccountForm
        open={accountFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        account={editingAccount}
        parentAccount={parentAccount}
        organizations={organizations}
        loading={formLoading}
      />

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

export default AccountsManagementPage;