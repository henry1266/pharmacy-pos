import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { TransactionGroupForm } from '../components/accounting2/TransactionGroupForm';
import AccountManagement from '../components/accounting2/AccountManagement';
import {
  fetchTransactionGroups2,
  createTransactionGroup2,
  updateTransactionGroup2,
  deleteTransactionGroup2,
  fetchAccounts2
} from '../redux/actions';

// 新增機構相關 actions
const fetchOrganizations2 = () => async (dispatch: any) => {
  try {
    dispatch({ type: 'FETCH_ORGANIZATIONS2_REQUEST' });
    const response = await fetch('/api/organizations', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      const organizations = Array.isArray(data.data) ? data.data : [];
      dispatch({ type: 'FETCH_ORGANIZATIONS2_SUCCESS', payload: organizations });
    }
  } catch (error) {
    dispatch({ type: 'FETCH_ORGANIZATIONS2_FAILURE', payload: 'Failed to fetch organizations' });
  }
};

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

interface TransactionGroupFormData {
  description: string;
  transactionDate: Date;
  organizationId?: string;
  invoiceNo: string;
  receiptUrl?: string;
  attachments: File[];
  entries: AccountingEntry[];
}

export const Accounting2Page: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { transactionId } = useParams<{ transactionId?: string }>();
  const isCopyMode = window.location.pathname.includes('/copy');
  const returnTo = searchParams.get('returnTo');
  
  // Redux state
  const { transactionGroups, loading, error } = useAppSelector(state => state.transactionGroup2);
  
  // Local state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionGroup | null>(null);
  const [copyingTransaction, setCopyingTransaction] = useState<TransactionGroup | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<TransactionGroup | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入交易群組、會計科目和機構資料
  useEffect(() => {
    console.log('🔄 Accounting2Page 初始化載入資料');
    dispatch(fetchTransactionGroups2() as any);
    dispatch(fetchAccounts2() as any);
    dispatch(fetchOrganizations2() as any);
  }, [dispatch]);

  // 監聽 Redux 狀態變化，用於除錯
  useEffect(() => {
    console.log('📊 TransactionGroups 狀態變化:', {
      transactionGroupsLength: transactionGroups.length,
      loading,
      error,
      firstTransaction: transactionGroups[0]
    });
  }, [transactionGroups, loading, error]);

  // 處理從 URL 參數進入編輯或複製模式
  useEffect(() => {
    if (transactionId && transactionGroups.length > 0) {
      const transactionToProcess = transactionGroups.find(t => t._id === transactionId);
      if (transactionToProcess) {
        if (isCopyMode) {
          console.log('📋 從 URL 參數自動打開複製對話框:', transactionToProcess);
          // 複製模式：設置要複製的交易，但編輯交易設為 null（表示新增模式）
          setCopyingTransaction(transactionToProcess);
          setEditingTransaction(null);
          setDialogOpen(true);
        } else {
          console.log('🔧 從 URL 參數自動打開編輯對話框:', transactionToProcess);
          setEditingTransaction(transactionToProcess);
          setCopyingTransaction(null);
          setDialogOpen(true);
        }
      }
    }
  }, [transactionId, transactionGroups, isCopyMode]);

  // 處理新增交易
  const handleCreateNew = () => {
    setEditingTransaction(null);
    setCopyingTransaction(null);
    setDialogOpen(true);
  };

  // 處理編輯交易
  const handleEdit = (transactionGroup: TransactionGroup) => {
    setEditingTransaction(transactionGroup);
    setDialogOpen(true);
  };

  // 處理檢視交易
  const handleView = (transactionGroup: TransactionGroup) => {
    setViewingTransaction(transactionGroup);
  };

  // 處理刪除交易
  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這筆交易嗎？此操作無法復原。')) {
      try {
        await dispatch(deleteTransactionGroup2(id) as any);
        showSnackbar('交易已成功刪除', 'success');
      } catch (error) {
        console.error('刪除交易失敗:', error);
        showSnackbar('刪除交易失敗', 'error');
      }
    }
  };

  // 處理表單提交
  const handleFormSubmit = async (formData: TransactionGroupFormData) => {
    try {
      console.log('🔍 handleFormSubmit 開始:', { editingTransaction, copyingTransaction, isCopyMode, returnTo, formData });
      
      if (editingTransaction) {
        await dispatch(updateTransactionGroup2(editingTransaction._id, formData) as any);
        showSnackbar('交易已成功更新', 'success');
        
        // 先關閉對話框
        setDialogOpen(false);
        setEditingTransaction(null);
        setCopyingTransaction(null);
        
        // 手動重新載入交易群組資料
        setTimeout(() => {
          dispatch(fetchTransactionGroups2() as any);
        }, 100);
        
        // 只有在編輯模式且有 returnTo 參數時，才自動導航回原頁面
        if (returnTo && editingTransaction) {
          console.log('🔄 編輯成功，準備返回原頁面:', decodeURIComponent(returnTo));
          setTimeout(() => {
            navigate(decodeURIComponent(returnTo));
          }, 1000); // 延遲 1 秒讓用戶看到成功訊息
        }
      } else {
        await dispatch(createTransactionGroup2(formData) as any);
        showSnackbar(copyingTransaction ? '交易已成功複製' : '交易已成功建立', 'success');
        
        // 先關閉對話框
        setDialogOpen(false);
        setEditingTransaction(null);
        setCopyingTransaction(null);
        
        // 手動重新載入交易群組資料
        setTimeout(() => {
          dispatch(fetchTransactionGroups2() as any);
        }, 100);
        
        // 如果是複製模式且有 returnTo 參數，自動導航回原頁面
        if (copyingTransaction && returnTo) {
          console.log('🔄 複製成功，準備返回原頁面:', decodeURIComponent(returnTo));
          setTimeout(() => {
            navigate(decodeURIComponent(returnTo));
          }, 1000); // 延遲 1 秒讓用戶看到成功訊息
        }
      }
    } catch (error) {
      console.error('表單提交失敗:', error);
      showSnackbar(editingTransaction ? '更新交易失敗' : '建立交易失敗', 'error');
    }
  };

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 關閉通知
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 關閉對話框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
    setCopyingTransaction(null);
    
    // 如果是從 URL 參數進入的複製模式，關閉對話框時返回交易列表
    if (isCopyMode && transactionId && returnTo) {
      navigate('/accounting2');
    }
  };

  // 關閉檢視對話框
  const handleCloseViewDialog = () => {
    setViewingTransaction(null);
  };


  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 頁面標題 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            複式記帳系統
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          管理會計科目結構，查看分錄明細，建立複式記帳交易
        </Typography>
      </Box>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 科目管理 */}
      <AccountManagement
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />

      {/* 新增/編輯交易對話框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingTransaction ? '編輯交易群組' : copyingTransaction ? '複製交易群組' : '建立交易群組'}
        </DialogTitle>
        <DialogContent>
          <TransactionGroupForm
            mode={editingTransaction ? 'edit' : 'create'}
            initialData={editingTransaction ? {
              description: editingTransaction.description,
              transactionDate: new Date(editingTransaction.transactionDate),
              organizationId: editingTransaction.organizationId,
              receiptUrl: editingTransaction.receiptUrl || '',
              invoiceNo: editingTransaction.invoiceNo || '',
              entries: Array.isArray(editingTransaction.entries) ? editingTransaction.entries.map(entry => ({
                accountId: entry.accountId || '',
                debitAmount: entry.debitAmount || 0,
                creditAmount: entry.creditAmount || 0,
                description: entry.description || ''
              })) : []
            } : copyingTransaction ? {
              description: '', // 複製時清空描述，讓用戶輸入新的摘要
              transactionDate: new Date(), // 複製時使用今天的日期
              organizationId: copyingTransaction.organizationId,
              receiptUrl: '', // 複製時清空憑證 URL
              invoiceNo: '', // 複製時清空發票號碼
              entries: Array.isArray(copyingTransaction.entries) ? copyingTransaction.entries.map(entry => ({
                accountId: entry.accountId || '',
                debitAmount: entry.debitAmount || 0,
                creditAmount: entry.creditAmount || 0,
                description: entry.description || ''
              })) : []
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            取消
          </Button>
        </DialogActions>
      </Dialog>

      {/* 檢視交易對話框 */}
      <Dialog
        open={!!viewingTransaction}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          交易詳情
        </DialogTitle>
        <DialogContent>
          {viewingTransaction && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {viewingTransaction.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                交易日期：{new Date(viewingTransaction.transactionDate).toLocaleDateString('zh-TW')}
              </Typography>
              {viewingTransaction.invoiceNo && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  發票號碼：{viewingTransaction.invoiceNo}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                總金額：NT$ {viewingTransaction.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color={viewingTransaction.isBalanced ? 'success.main' : 'error.main'}>
                狀態：{viewingTransaction.isBalanced ? '已平衡' : '未平衡'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>
            關閉
          </Button>
          {viewingTransaction && (
            <Button
              variant="contained"
              onClick={() => {
                handleCloseViewDialog();
                handleEdit(viewingTransaction);
              }}
            >
              編輯
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

export default Accounting2Page;