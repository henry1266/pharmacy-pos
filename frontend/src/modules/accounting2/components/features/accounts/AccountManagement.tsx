import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountTree as AccountTreeIcon
} from '@mui/icons-material';
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { useAccountManagement } from '../../../core/hooks/useAccountManagement';
import { useAccountForm } from '../../../core/hooks/useAccountForm';
import { AccountTreeView } from './AccountTreeView';
import { AccountDetailsPanel } from './AccountDetailsPanel';
import { AccountEntryGrid } from './AccountEntryGrid';
import { AccountForm } from './AccountForm';

// 交易管理相關介面
interface TransactionGroup {
  _id: string;
  description: string;
  transactionDate: string;
  organizationId?: string;
  invoiceNo?: string;
  receiptUrl?: string;
  totalAmount: number;
  isBalanced: boolean;
  entries: AccountingEntry[];
  createdAt: string;
  updatedAt: string;
}

interface AccountingEntry {
  _id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

// AccountManagement 組件的 Props 介面
interface AccountManagementProps {
  onCreateNew?: () => void;
  onEdit?: (transactionGroup: TransactionGroup) => void;
  onView?: (transactionGroup: TransactionGroup) => void;
  onDelete?: (id: string) => void;
}

export const AccountManagement: React.FC<AccountManagementProps> = ({
  onCreateNew,
  onEdit,
  onView,
  onDelete
}) => {
  const navigate = useNavigate();
  
  // 使用自定義 Hook 管理會計科目相關狀態
  const {
    // 資料狀態
    accounts,
    organizations,
    accountBalances,
    entries,
    statistics,
    
    // 載入狀態
    loading,
    entriesLoading,
    
    // 錯誤與通知
    notification,
    
    // 選擇狀態
    selectedAccount,
    selectedOrganizationId,
    
    // 搜尋與篩選
    searchTerm,
    selectedAccountType,
    
    // 樹狀結構
    expandedNodes,
    
    // 函數
    loadAccounts,
    loadDoubleEntries,
    showNotification,
    
    // 設定函數
    setSelectedAccount,
    setSelectedOrganizationId,
    setSearchTerm,
    setSelectedAccountType,
    setExpandedNodes
  } = useAccountManagement();

  // 使用表單管理 Hook
  const {
    // 對話框狀態
    openDialog,
    editingAccount,
    
    // 表單資料
    formData,
    
    // 函數
    handleOpenDialog,
    handleCloseDialog,
    saveAccount,
    setFormData
  } = useAccountForm({
    organizations,
    onSuccess: () => {
      loadAccounts();
      showNotification('操作成功', 'success');
    },
    onError: (message) => {
      showNotification(message, 'error');
    },
    onAccountsChange: loadAccounts
  });

  // 搜尋展開狀態
  const [searchExpanded, setSearchExpanded] = useState(false);

  // 處理科目選擇
  const handleAccountSelect = (account: Account2) => {
    setSelectedAccount(account);
    loadDoubleEntries(account._id);
  };

  // 處理樹狀節點展開/收合
  const handleNodeToggle = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // 處理搜尋篩選重置
  const handleSearchReset = () => {
    setSearchTerm('');
    setSelectedAccountType('');
    setSelectedOrganizationId('');
    loadAccounts();
  };

  // 處理刪除科目
  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm('確定要刪除此會計科目嗎？')) {
      return;
    }
    // 這裡應該調用刪除 API
    showNotification('刪除功能待實作', 'warning');
  };

  // 處理分錄操作
  const handleEntryEdit = (entry: any) => {
    // 編輯分錄邏輯
    console.log('編輯分錄:', entry);
  };

  const handleEntryDelete = (entryId: string) => {
    // 刪除分錄邏輯
    console.log('刪除分錄:', entryId);
  };

  const handleEntryView = (entry: any) => {
    // 查看分錄詳情邏輯
    console.log('查看分錄:', entry);
  };

  return (
    <Box sx={{ p: 0.5 }}>
      {/* 搜尋按鈕 - 右上角 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 0.25 }}>
        <Tooltip title={searchExpanded ? "收合搜尋" : "展開搜尋"}>
          <IconButton
            color="primary"
            onClick={() => setSearchExpanded(!searchExpanded)}
            sx={{
              backgroundColor: searchExpanded ? 'primary.50' : 'transparent',
              '&:hover': { backgroundColor: searchExpanded ? 'primary.100' : 'action.hover' }
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 搜尋篩選面板已移除 - 功能已整合至 accounting3 */}
      {searchExpanded && (
        <Paper sx={{ p: 2, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            搜尋功能已遷移至 accounting3 模組
          </Typography>
        </Paper>
      )}

      {/* 主要內容區域 - 左右分割佈局 */}
      <Paper sx={{ height: '650px', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* 左半邊：科目樹狀結構 */}
          <Box sx={{
            width: '42%',
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountTreeIcon sx={{ mr: 1 }} />
                  科目階層結構
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ ml: 2 }}
                >
                  新增科目
                </Button>
              </Box>
            </Box>
            
            <AccountTreeView
              accounts={accounts}
              organizations={organizations}
              selectedAccount={selectedAccount}
              expandedNodes={expandedNodes}
              accountBalances={accountBalances}
              loading={loading}
              onAccountSelect={handleAccountSelect}
              onNodeToggle={handleNodeToggle}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteAccount}
              onNavigate={(accountId) => navigate(`/accounting2/account/${accountId}`)}
            />
          </Box>

          {/* 右半邊：選中科目的詳細資訊 */}
          <Box sx={{
            width: '58%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Typography variant="h6">
                    分錄明細
                  </Typography>
                  {selectedAccount && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      {selectedAccount.code} - {selectedAccount.name}
                    </Typography>
                  )}
                </Box>
                {onCreateNew && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={onCreateNew}
                  >
                    新增交易
                  </Button>
                )}
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {selectedAccount ? (
                <>
                  {/* 統計摘要已移除 - 功能已整合至 accounting3 */}
                  <Paper sx={{ p: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      統計功能已遷移至 accounting3 模組
                    </Typography>
                  </Paper>

                  {/* 分錄明細表格 */}
                  <Box sx={{ flex: 1, p: 0.5 }}>
                    <AccountEntryGrid
                      entries={entries}
                      loading={entriesLoading}
                      onEdit={handleEntryEdit}
                      onDelete={handleEntryDelete}
                      onView={handleEntryView}
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary',
                  p: 3
                }}>
                  <AccountTreeIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" gutterBottom>
                    請選擇一個科目
                  </Typography>
                  <Typography variant="body2" textAlign="center">
                    點擊左側樹狀結構中的葉子節點科目<br />
                    查看該科目的分錄明細
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* 新增/編輯科目表單對話框 */}
      <AccountForm
        open={openDialog}
        account={editingAccount}
        onClose={handleCloseDialog}
        onSubmit={saveAccount}
        loading={false}
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
      />

      {/* 通知 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => showNotification('', 'info')}
      >
        <Alert
          onClose={() => showNotification('', 'info')}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountManagement;