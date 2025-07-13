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
  const handleAccountEdit = async (account: Account2) => {
    console.log('編輯科目:', account);
    setEditingAccount(account);
    
    // 如果科目有父科目ID，載入父科目資訊
    if (account.parentId) {
      try {
        console.log('載入父科目資訊，parentId:', account.parentId);
        const parentResponse = await accounting3Service.accounts.getById(account.parentId);
        if (parentResponse.success) {
          console.log('父科目載入成功:', parentResponse.data);
          setParentAccount(parentResponse.data);
        } else {
          console.warn('載入父科目失敗:', parentResponse);
          setParentAccount(null);
        }
      } catch (error) {
        console.error('載入父科目時發生錯誤:', error);
        setParentAccount(null);
        showSnackbar('載入父科目資訊失敗', 'warning');
      }
    } else {
      setParentAccount(null);
    }
    
    setAccountFormOpen(true);
  };

  // 處理刪除科目
  const handleAccountDelete = async (accountId: string) => {
    console.log('刪除科目:', accountId);
    
    // 增強的刪除確認邏輯
    const confirmMessage = selectedAccount?.balance && selectedAccount.balance !== 0
      ? `此科目有餘額 ${selectedAccount.balance}，確定要刪除嗎？\n\n注意：刪除有餘額的科目可能會影響財務報表的準確性。\n\n此操作無法復原。`
      : '確定要刪除這個科目嗎？此操作無法復原。';
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await accounting3Service.accounts.delete(accountId);
        if (response.success) {
          showSnackbar('科目已成功刪除', 'success');
          // 清除選中的科目（如果是被刪除的科目）
          if (selectedAccount?._id === accountId) {
            setSelectedAccount(null);
          }
          // 強制重新載入階層
          setHierarchyKey(prev => prev + 1);
        } else {
          showSnackbar(response.message || '刪除科目失敗', 'error');
        }
      } catch (error) {
        console.error('刪除科目失敗:', error);
        const errorMessage = error instanceof Error ? error.message : '刪除科目失敗';
        showSnackbar(errorMessage, 'error');
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
              console.log('🔍 編輯交易 - 原始物件:', transaction);
              console.log('🔍 _id 屬性詳細信息:', {
                _id: transaction._id,
                type: typeof transaction._id,
                stringified: JSON.stringify(transaction._id)
              });
              
              // 專門處理 MongoDB ObjectId 格式的提取邏輯
              const extractObjectId = (idValue: any): string => {
                if (!idValue) return '';
                
                // 如果已經是字串，直接返回
                if (typeof idValue === 'string') {
                  return idValue;
                }
                
                // 如果是物件，檢查是否有 $oid 屬性（MongoDB 標準格式）
                if (typeof idValue === 'object' && idValue !== null) {
                  // 優先檢查 $oid 屬性（這是 MongoDB 的標準格式）
                  if (idValue.$oid && typeof idValue.$oid === 'string') {
                    console.log('✅ 找到 $oid 屬性:', idValue.$oid);
                    return idValue.$oid;
                  }
                  
                  // 檢查是否有 toString 方法
                  if (typeof idValue.toString === 'function') {
                    try {
                      const stringValue = idValue.toString();
                      if (stringValue !== '[object Object]') {
                        console.log('✅ 使用 toString():', stringValue);
                        return stringValue;
                      }
                    } catch (e) {
                      console.warn('❌ toString() 失敗:', e);
                    }
                  }
                  
                  // 檢查是否有 toHexString 方法（Mongoose ObjectId）
                  if (typeof idValue.toHexString === 'function') {
                    try {
                      const hexString = idValue.toHexString();
                      console.log('✅ 使用 toHexString():', hexString);
                      return hexString;
                    } catch (e) {
                      console.warn('❌ toHexString() 失敗:', e);
                    }
                  }
                }
                
                // 最後嘗試直接字串轉換
                const stringValue = String(idValue);
                if (stringValue !== '[object Object]') {
                  console.log('✅ 使用 String() 轉換:', stringValue);
                  return stringValue;
                }
                
                console.error('❌ 無法提取 ObjectId:', idValue);
                return '';
              };
              
              const transactionId = extractObjectId(transaction._id);
              console.log('🎯 最終提取的交易 ID:', transactionId);
              
              // 驗證 ID 是否有效（MongoDB ObjectId 應該是 24 個字符的十六進制字串）
              const isValidObjectId = (id: string): boolean => {
                return /^[0-9a-fA-F]{24}$/.test(id);
              };
              
              if (transactionId && isValidObjectId(transactionId)) {
                console.log('✅ 導航到編輯頁面:', `/accounting3/transaction/${transactionId}/edit`);
                navigate(`/accounting3/transaction/${transactionId}/edit`);
              } else {
                console.error('❌ 交易 ID 無效或格式錯誤:', {
                  transaction,
                  extractedId: transactionId,
                  isValidFormat: isValidObjectId(transactionId),
                  idType: typeof transaction._id,
                  idValue: transaction._id
                });
                showSnackbar(`無法編輯交易：交易 ID 無效 (${transactionId})`, 'error');
              }
            }}
            onAddTransaction={(accountId) => {
              console.log('為科目新增交易:', accountId);
              // 導航到新增交易頁面，並預設選中的科目
              navigate(`/accounting3/transaction/new?defaultAccountId=${accountId}`);
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
            aria-label="返回會計系統"
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