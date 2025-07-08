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
import { TransactionGroupForm } from '../modules/accounting2/components/features/transactions/TransactionGroupForm';
import AccountManagement from '../modules/accounting2/components/features/accounts/AccountManagement';
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
  status?: 'draft' | 'confirmed' | 'cancelled'; // 添加狀態欄位
  createdAt: string;
  updatedAt: string;
  // API 回應可能包含巢狀的 transactionGroup 結構
  transactionGroup?: {
    _id: string;
    description: string;
    transactionDate: string;
    organizationId?: string;
    invoiceNo?: string;
    receiptUrl?: string;
    totalAmount: number;
    status?: 'draft' | 'confirmed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
  };
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
  const defaultAccountId = searchParams.get('defaultAccountId');
  const defaultOrganizationId = searchParams.get('defaultOrganizationId');
  console.log('🔍 Accounting2Page URL 參數檢查:', {
    searchParams: Object.fromEntries(searchParams.entries()),
    defaultAccountId,
    defaultOrganizationId,
    returnTo,
    isCopyMode,
    pathname: window.location.pathname
  });
  
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

  // 載入交易群組、會計科目和機構資料 - 只在組件掛載時執行一次
  useEffect(() => {
    console.log('🔄 Accounting2Page 初始化載入資料');
    dispatch(fetchTransactionGroups2() as any);
    dispatch(fetchAccounts2() as any);
    dispatch(fetchOrganizations2() as any);
  }, []); // 移除 dispatch 依賴項，避免無限循環

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
    if (transactionId) {
      // 先嘗試從 Redux store 中找交易
      const transactionToProcess = transactionGroups.find(t => t._id === transactionId);
      
      if (transactionToProcess) {
        // 在 Redux store 中找到交易
        if (isCopyMode) {
          console.log('📋 從 Redux store 自動打開複製對話框:', transactionToProcess);
          setCopyingTransaction(transactionToProcess);
          setEditingTransaction(null);
          setDialogOpen(true);
        } else {
          console.log('🔧 從 Redux store 自動打開編輯對話框:', transactionToProcess);
          setEditingTransaction(transactionToProcess);
          setCopyingTransaction(null);
          setDialogOpen(true);
        }
      } else if (transactionGroups.length > 0) {
        // Redux store 已載入但找不到交易，直接透過 API 獲取
        console.log('🔍 Redux store 中找不到交易，透過 API 直接獲取:', transactionId);
        fetchTransactionDirectly(transactionId);
      }
      // 如果 transactionGroups.length === 0，表示還在載入中，等待下次 effect 觸發
    }
  }, [transactionId, transactionGroups, isCopyMode]);

  // 直接透過 API 獲取單一交易
  const fetchTransactionDirectly = async (id: string) => {
    try {
      console.log('📡 直接 API 獲取交易:', id);
      const response = await fetch(`/api/accounting2/transaction-groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const transaction = result.data;
          console.log('✅ 直接 API 獲取交易成功:', transaction);
          console.log('🔍 API 回應的原始 transactionDate:', {
            value: transaction.transactionGroup?.transactionDate || transaction.transactionDate,
            type: typeof (transaction.transactionGroup?.transactionDate || transaction.transactionDate),
            isValidDate: !isNaN(new Date(transaction.transactionGroup?.transactionDate || transaction.transactionDate).getTime())
          });
          
          if (isCopyMode) {
            console.log('📋 透過 API 自動打開複製對話框:', transaction);
            setCopyingTransaction(transaction);
            setEditingTransaction(null);
            setDialogOpen(true);
          } else {
            console.log('🔧 透過 API 自動打開編輯對話框:', transaction);
            setEditingTransaction(transaction);
            setCopyingTransaction(null);
            setDialogOpen(true);
          }
        } else {
          console.error('❌ API 回應格式錯誤:', result);
          showSnackbar('找不到指定的交易', 'error');
        }
      } else {
        console.error('❌ API 請求失敗:', response.status, response.statusText);
        showSnackbar('載入交易失敗', 'error');
      }
    } catch (error) {
      console.error('❌ 直接獲取交易失敗:', error);
      showSnackbar('載入交易失敗', 'error');
    }
  };

  // 處理從科目詳情頁面的「增加明細」按鈕進入新增模式
  useEffect(() => {
    if (defaultAccountId && !transactionId && !dialogOpen) {
      console.log('🆕 從科目詳情頁面自動打開新增交易對話框，預設科目ID:', defaultAccountId, '預設機構ID:', defaultOrganizationId);
      setEditingTransaction(null);
      setCopyingTransaction(null);
      setDialogOpen(true);
    }
  }, [defaultAccountId, defaultOrganizationId, transactionId, dialogOpen]);

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
        
        // 處理返回邏輯：複製模式、新增模式（從科目詳情頁面進入）都需要返回
        if (returnTo && (copyingTransaction || defaultAccountId)) {
          const actionType = copyingTransaction ? '複製' : '新增';
          console.log(`🔄 ${actionType}成功，準備返回原頁面:`, decodeURIComponent(returnTo));
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
    <Container maxWidth="xl" sx={{ py: 1 }}>
      {/* 頁面標題 */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            複式記帳系統
          </Typography>
        </Box>
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
            defaultAccountId={defaultAccountId || undefined}
            defaultOrganizationId={defaultOrganizationId || undefined}
            isCopyMode={!!copyingTransaction}
            transactionId={editingTransaction?._id}
            currentStatus={editingTransaction?.status}
            onStatusChange={(newStatus) => {
              console.log('🔄 狀態變更:', { transactionId: editingTransaction?._id, newStatus });
              // 這裡可以添加狀態變更的處理邏輯
              if (editingTransaction) {
                // 更新本地狀態
                setEditingTransaction({
                  ...editingTransaction,
                  status: newStatus
                });
              }
            }}
            initialData={(() => {
              console.log('🔍 準備 initialData:', {
                editingTransaction: !!editingTransaction,
                copyingTransaction: !!copyingTransaction,
                isCopyModeParam: !!copyingTransaction,
                editingTransactionStatus: editingTransaction?.status,
                editingTransactionStructure: editingTransaction ? {
                  hasTransactionGroup: !!editingTransaction.transactionGroup,
                  directTransactionDate: editingTransaction.transactionDate,
                  nestedTransactionDate: editingTransaction.transactionGroup?.transactionDate,
                  directDescription: editingTransaction.description,
                  nestedDescription: editingTransaction.transactionGroup?.description
                } : null
              });
              
              // 安全的日期轉換函數
              const safeDateConvert = (dateValue: any): Date => {
                console.log('🔍 Accounting2Page safeDateConvert 輸入:', {
                  value: dateValue,
                  type: typeof dateValue,
                  isString: typeof dateValue === 'string',
                  isObject: typeof dateValue === 'object' && dateValue !== null
                });
                
                if (!dateValue) {
                  console.log('⚠️ 日期值為空，使用當前日期');
                  return new Date();
                }
                
                try {
                  // 處理 MongoDB 的 {$date: "..."} 格式
                  if (typeof dateValue === 'object' && dateValue.$date) {
                    console.log('🔍 處理 MongoDB $date 格式:', dateValue.$date);
                    const converted = new Date(dateValue.$date);
                    const isValid = !isNaN(converted.getTime());
                    console.log('✅ MongoDB 格式轉換結果:', { converted, isValid });
                    return isValid ? converted : new Date();
                  }
                  
                  // 處理一般格式
                  const converted = new Date(dateValue);
                  const isValid = !isNaN(converted.getTime());
                  console.log('✅ 一般格式轉換結果:', { converted, isValid });
                  return isValid ? converted : new Date();
                } catch (error) {
                  console.error('❌ 日期轉換失敗:', error);
                  return new Date();
                }
              };
              
              return editingTransaction ? {
                description: editingTransaction.transactionGroup?.description || editingTransaction.description,
                transactionDate: safeDateConvert(
                  editingTransaction.transactionGroup?.transactionDate || editingTransaction.transactionDate
                ),
                organizationId: editingTransaction.transactionGroup?.organizationId || editingTransaction.organizationId,
                receiptUrl: editingTransaction.transactionGroup?.receiptUrl || editingTransaction.receiptUrl || '',
                invoiceNo: editingTransaction.transactionGroup?.invoiceNo || editingTransaction.invoiceNo || '',
                entries: Array.isArray(editingTransaction.entries) ? editingTransaction.entries.map(entry => ({
                  accountId: entry.accountId || '',
                  debitAmount: entry.debitAmount || 0,
                  creditAmount: entry.creditAmount || 0,
                  description: entry.description || ''
                })) : []
              } : copyingTransaction ? {
                description: '', // 複製時清空描述，讓用戶輸入新的摘要
                transactionDate: new Date(), // 複製時使用今天的日期
                organizationId: copyingTransaction.transactionGroup?.organizationId || copyingTransaction.organizationId,
                receiptUrl: '', // 複製時清空憑證 URL
                invoiceNo: '', // 複製時清空發票號碼
                entries: Array.isArray(copyingTransaction.entries) ? copyingTransaction.entries.map(entry => ({
                  accountId: entry.accountId || '',
                  debitAmount: entry.debitAmount || 0,
                  creditAmount: entry.creditAmount || 0,
                  description: entry.description || ''
                })) : []
              } : undefined;
            })()}
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