import React, { useState, useEffect, useCallback } from 'react';
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
  Paper,
  Fab,
  Tooltip,
} from '@mui/material';
import { BreadcrumbNavigation } from '../components/ui/BreadcrumbNavigation';
import {
  AccountBalance as AccountBalanceIcon,
  ListAlt as ListIcon,
  Add as AddIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  AccountTree as AccountTreeIcon,
  Receipt as ReceiptIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../hooks/redux';

// 導入內嵌分錄組件
import { TransactionGroupFormWithEntries } from '../features/transactions/TransactionGroupFormWithEntries';
import { AccountingDataGridWithEntries } from '../components/ui';

// 導入內嵌分錄 Redux actions
import {
  fetchTransactionGroupsWithEntries,
  createTransactionGroupWithEntries,
  updateTransactionGroupWithEntries,
  deleteTransactionGroupWithEntries,
  confirmTransactionGroupWithEntries,
  unlockTransactionGroupWithEntries,
  fetchAccounts2,
  fetchOrganizations2
} from '../../../redux/actions';

// 導入共享類型
import {
  TransactionGroupWithEntries,
  EmbeddedAccountingEntry,
  TransactionGroupWithEntriesFormData,
  EmbeddedAccountingEntryFormData
} from '../../../../../shared/types/accounting2';

/**
 * /accounting3/transaction
 * 會計系統交易列表頁面
 * 專門用於管理交易的頁面
 */
export const Accounting3TransactionPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { transactionId } = useParams<{ transactionId?: string }>();
  const isCopyMode = window.location.pathname.includes('/copy');
  const isNewMode = window.location.pathname.includes('/new');
  const returnTo = searchParams.get('returnTo');
  const defaultAccountId = searchParams.get('defaultAccountId');
  const defaultOrganizationId = searchParams.get('defaultOrganizationId');
  
  // Redux state - 使用內嵌分錄狀態
  const { transactionGroups, loading, error } = useAppSelector(state => state.transactionGroupWithEntries);
  
  // Local state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [copyingTransaction, setCopyingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 使用 useCallback 記憶化數據加載函數
  const loadInitialData = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Accounting3TransactionPage 初始化載入資料');
    }
    
    // 使用 Promise.all 並行加載數據
    await Promise.all([
      dispatch(fetchTransactionGroupsWithEntries() as any),
      dispatch(fetchAccounts2() as any),
      dispatch(fetchOrganizations2() as any)
    ]);
  }, [dispatch]);

  // 載入交易群組和會計科目資料
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 監聽 Redux 狀態變化
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 TransactionGroupsWithEntries 狀態變化:', {
        transactionGroupsLength: transactionGroups.length,
        loading,
        error,
        firstTransaction: transactionGroups[0]
      });
    }
  }, [transactionGroups, loading, error]);

  // 處理從 URL 參數進入編輯或複製模式
  useEffect(() => {
    if (transactionId) {
      const transactionToProcess = transactionGroups.find(t => t._id === transactionId);
      
      if (transactionToProcess) {
        if (isCopyMode) {
          if (process.env.NODE_ENV === 'development') {
            console.log('📋 從 Redux store 自動打開複製對話框:', transactionToProcess);
          }
          setCopyingTransaction(transactionToProcess);
          setEditingTransaction(null);
          setDialogOpen(true);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔧 從 Redux store 自動打開編輯對話框:', transactionToProcess);
          }
          setEditingTransaction(transactionToProcess);
          setCopyingTransaction(null);
          setDialogOpen(true);
        }
      } else if (transactionGroups.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Redux store 中找不到交易，透過 API 直接獲取:', transactionId);
        }
        fetchTransactionDirectly(transactionId);
      }
    }
  }, [transactionId, transactionGroups, isCopyMode]);

  // 直接透過 API 獲取單一交易
  const fetchTransactionDirectly = async (id: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 直接 API 獲取內嵌分錄交易:', id);
      }
      const response = await fetch(`/api/accounting2/transaction-groups-with-entries/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const transaction = result.data;
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ 直接 API 獲取內嵌分錄交易成功:', transaction);
          }
          
          if (isCopyMode) {
            if (process.env.NODE_ENV === 'development') {
              console.log('📋 透過 API 自動打開複製對話框:', transaction);
            }
            setCopyingTransaction(transaction);
            setEditingTransaction(null);
            setDialogOpen(true);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔧 透過 API 自動打開編輯對話框:', transaction);
            }
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
      if (process.env.NODE_ENV === 'development') {
        console.log('🆕 從科目詳情頁面自動打開新增交易對話框，預設科目ID:', defaultAccountId, '預設機構ID:', defaultOrganizationId);
      }
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
  const handleEdit = (transactionGroup: TransactionGroupWithEntries) => {
    setEditingTransaction(transactionGroup);
    setDialogOpen(true);
  };

  // 處理檢視交易
  const handleView = (transactionGroup: TransactionGroupWithEntries) => {
    setViewingTransaction(transactionGroup);
    setDetailDialogOpen(true);
  };

  // 處理刪除交易
  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這筆交易嗎？此操作無法復原。')) {
      try {
        await dispatch(deleteTransactionGroupWithEntries(id) as any);
        showSnackbar('交易已成功刪除', 'success');
      } catch (error) {
        console.error('刪除交易失敗:', error);
        showSnackbar('刪除交易失敗', 'error');
      }
    }
  };

  // 處理複製交易
  const handleCopy = (transactionGroup: TransactionGroupWithEntries) => {
    setCopyingTransaction(transactionGroup);
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  // 處理確認交易
  const handleConfirm = async (id: string) => {
    if (window.confirm('確定要確認這筆交易嗎？確認後將無法直接編輯。')) {
      try {
        await dispatch(confirmTransactionGroupWithEntries(id) as any);
        showSnackbar('交易已成功確認', 'success');
        // 重新載入資料以更新狀態
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 確認交易後重新載入交易列表');
          }
          dispatch(fetchTransactionGroupsWithEntries() as any);
        }, 500);
      } catch (error) {
        console.error('確認交易失敗:', error);
        showSnackbar('確認交易失敗', 'error');
      }
    }
  };

  // 處理解鎖交易
  const handleUnlock = async (id: string) => {
    if (window.confirm('確定要解鎖這筆交易嗎？解鎖後交易將回到草稿狀態。')) {
      try {
        await dispatch(unlockTransactionGroupWithEntries(id) as any);
        showSnackbar('交易已成功解鎖', 'success');
        // 重新載入資料以更新狀態
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 解鎖交易後重新載入交易列表');
          }
          dispatch(fetchTransactionGroupsWithEntries() as any);
        }, 500);
      } catch (error) {
        console.error('解鎖交易失敗:', error);
        showSnackbar('解鎖交易失敗', 'error');
      }
    }
  };

  // 處理表單提交
  const handleFormSubmit = async (formData: TransactionGroupWithEntriesFormData) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [Accounting3] handleFormSubmit 開始:', {
          mode: editingTransaction ? 'edit' : 'create',
          isCopyMode: !!copyingTransaction,
          transactionId: editingTransaction?._id,
          returnTo,
          formDataSummary: {
            description: formData.description,
            organizationId: formData.organizationId,
            entriesCount: formData.entries?.length || 0,
            hasLinkedTransactions: !!(formData.linkedTransactionIds?.length),
            fundingType: formData.fundingType
          }
        });
      }
      
      // 資料驗證
      if (!formData.description?.trim()) {
        throw new Error('交易描述不能為空');
      }
      
      if (!formData.entries || formData.entries.length < 2) {
        throw new Error('至少需要兩筆分錄');
      }
      
      // 檢查借貸平衡
      const totalDebit = formData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
      const totalCredit = formData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
      if (Math.abs(totalDebit - totalCredit) >= 0.01) {
        throw new Error(`借貸不平衡：借方 ${totalDebit.toFixed(2)}，貸方 ${totalCredit.toFixed(2)}`);
      }
      
      // 轉換表單資料為 Redux action 期望的格式
      const convertFormDataToApiData = (data: TransactionGroupWithEntriesFormData): Omit<TransactionGroupWithEntries, '_id' | 'createdAt' | 'updatedAt'> => {
        const converted = {
          description: data.description?.trim() || '',
          transactionDate: data.transactionDate,
          organizationId: data.organizationId?.trim() || null,
          receiptUrl: data.receiptUrl?.trim() || '',
          invoiceNo: data.invoiceNo?.trim() || '',
          entries: data.entries || [],
          linkedTransactionIds: data.linkedTransactionIds || [],
          sourceTransactionId: data.sourceTransactionId,
          fundingType: data.fundingType || 'original',
          status: copyingTransaction ? 'confirmed' : 'draft' // 複製模式下設為已確認，否則為草稿
        } as Omit<TransactionGroupWithEntries, '_id' | 'createdAt' | 'updatedAt'>;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 [Accounting3] 轉換後的 API 資料:', {
            ...converted,
            entries: converted.entries.map(entry => ({
              accountId: entry.accountId,
              debitAmount: entry.debitAmount,
              creditAmount: entry.creditAmount,
              description: entry.description
            })),
            isCopyMode: !!copyingTransaction,
            statusReason: copyingTransaction ? '複製模式：自動設為已確認' : '新建模式：設為草稿'
          });
        }
        
        return converted;
      };

      const apiData = convertFormDataToApiData(formData);
      
      if (editingTransaction) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 [Accounting3] 執行更新操作:', editingTransaction._id);
        }
        
        // 對於更新操作，使用 Partial 類型
        const updateData: Partial<TransactionGroupWithEntries> = {
          description: apiData.description,
          transactionDate: apiData.transactionDate,
          organizationId: apiData.organizationId || '',
          receiptUrl: apiData.receiptUrl || '',
          invoiceNo: apiData.invoiceNo || '',
          entries: apiData.entries,
          linkedTransactionIds: apiData.linkedTransactionIds,
          sourceTransactionId: apiData.sourceTransactionId || '',
          fundingType: apiData.fundingType
        };
        
        const updatedResult = await dispatch(updateTransactionGroupWithEntries(editingTransaction._id, updateData) as any);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [Accounting3] 更新操作完成:', updatedResult);
        }
        
        showSnackbar('交易已成功更新', 'success');
        
        // 立即更新本地編輯狀態
        if (updatedResult && (updatedResult as any).payload) {
          setEditingTransaction((updatedResult as any).payload);
        }
        
        setDialogOpen(false);
        setEditingTransaction(null);
        setCopyingTransaction(null);
        
        // 增加延遲時間確保後端完成更新
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 編輯成功後重新載入交易列表');
          }
          dispatch(fetchTransactionGroupsWithEntries() as any);
        }, 500);
        
        if (returnTo && editingTransaction) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 編輯成功，準備返回原頁面:', decodeURIComponent(returnTo));
          }
          setTimeout(() => {
            navigate(decodeURIComponent(returnTo));
          }, 1000);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('🆕 [Accounting3] 執行建立操作');
        }
        
        const createResult = await dispatch(createTransactionGroupWithEntries(apiData) as any);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [Accounting3] 建立操作完成:', createResult);
        }
        
        showSnackbar(copyingTransaction ? '交易已成功複製並確認' : '交易已成功建立', 'success');
        
        setDialogOpen(false);
        setEditingTransaction(null);
        setCopyingTransaction(null);
        
        // 增加延遲時間確保後端完成創建
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 新增/複製成功後重新載入交易列表');
          }
          dispatch(fetchTransactionGroupsWithEntries() as any);
        }, 500);
        
        if (returnTo && (copyingTransaction || defaultAccountId)) {
          const actionType = copyingTransaction ? '複製' : '新增';
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 ${actionType}成功，準備返回原頁面:`, decodeURIComponent(returnTo));
          }
          setTimeout(() => {
            navigate(decodeURIComponent(returnTo));
          }, 1000);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [Accounting3] 表單提交失敗:', error);
        console.error('❌ [Accounting3] 錯誤詳情:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          editingTransaction: !!editingTransaction,
          copyingTransaction: !!copyingTransaction,
          formDataSummary: {
            description: formData.description,
            organizationId: formData.organizationId,
            entriesCount: formData.entries?.length || 0
          }
        });
      }
      
      // 根據錯誤類型顯示更具體的錯誤訊息
      let errorMessage = editingTransaction ? '更新交易失敗' : '建立交易失敗';
      if (error instanceof Error) {
        if (error.message.includes('建立交易群組失敗')) {
          errorMessage = error.message;
        } else if (error.message.includes('借貸不平衡')) {
          errorMessage = error.message;
        } else if (error.message.includes('認證失敗')) {
          errorMessage = '認證失敗，請重新登入';
        } else if (error.message.includes('請求資料格式錯誤')) {
          errorMessage = '資料格式錯誤，請檢查輸入內容';
        } else if (error.message.includes('伺服器內部錯誤')) {
          errorMessage = '伺服器錯誤，請稍後再試';
        } else {
          errorMessage = `${errorMessage}：${error.message}`;
        }
      }
      
      showSnackbar(errorMessage, 'error');
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
    
    if (isCopyMode && transactionId && returnTo) {
      navigate('/accounting3/transaction');
    }
  };

  // 關閉詳情對話框
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setViewingTransaction(null);
  };

  // 安全的日期轉換函數
  const safeDateConvert = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    
    try {
      if (typeof dateValue === 'object' && dateValue.$date) {
        const converted = new Date(dateValue.$date);
        return !isNaN(converted.getTime()) ? converted : new Date();
      }
      
      const converted = new Date(dateValue);
      return !isNaN(converted.getTime()) ? converted : new Date();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 日期轉換失敗:', error);
      }
      return new Date();
    }
  };

  // 如果是新增模式，直接顯示新增表單
  if (isNewMode) {
    return (
      <Container maxWidth="xl" sx={{ py: 1 }}>
        {/* 頁面標題 */}
        <Box sx={{ mb: 3 }}>
          
          {/* 麵包屑導航 */}
          <BreadcrumbNavigation
            items={[
              {
                label: '會計系統',
                path: '/accounting3',
                icon: <AccountBalanceIcon fontSize="small" />
              },
              {
                label: '交易管理',
                path: '/accounting3/transaction',
                icon: <ReceiptIcon fontSize="small" />
              },
              {
                label: '新增交易',
                icon: <AddIcon fontSize="small" />
              }
            ]}
          />
        </Box>

        {/* 錯誤提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 新增交易表單 */}
        <Paper sx={{ width: '100%', p: 3 }}>
          <TransactionGroupFormWithEntries
            mode="create"
            defaultAccountId={defaultAccountId || ''}
            defaultOrganizationId={defaultOrganizationId || ''}
            onSubmit={async (formData) => {
              await handleFormSubmit(formData);
              navigate('/accounting3/transaction');
            }}
            onCancel={() => navigate('/accounting3/transaction')}
          />
        </Paper>

        {/* 右側固定按鈕 - 返回列表 */}
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
          <Tooltip title="返回交易列表" placement="left" arrow>
            <Fab color="secondary" size="medium" onClick={() => navigate('/accounting3/transaction')} aria-label="返回交易列表">
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
  }

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      {/* 頁面標題 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 麵包屑導航 */}
          <BreadcrumbNavigation
            items={[
              {
                label: '會計首頁',
                path: '/accounting3',
                icon: <HomeIcon fontSize="small" />
              },
              {
                label: '交易列表',
                icon: <ReceiptIcon fontSize="small" />
              }
            ]}
          />
        </Box>
        

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 主要內容區域 - 交易管理 */}
      <AccountingDataGridWithEntries
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onCreateNew={() => navigate('/accounting3/transaction/new')}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onConfirm={handleConfirm}
        onUnlock={handleUnlock}
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
          <TransactionGroupFormWithEntries
            mode={editingTransaction ? 'edit' : 'create'}
            defaultAccountId={defaultAccountId || ''}
            defaultOrganizationId={defaultOrganizationId || ''}
            isCopyMode={!!copyingTransaction}
            {...(editingTransaction?._id && { transactionId: editingTransaction._id })}
            {...(editingTransaction?.status && { currentStatus: editingTransaction.status })}
            onStatusChange={(newStatus) => {
              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 狀態變更:', { transactionId: editingTransaction?._id, newStatus });
              }
              if (editingTransaction) {
                setEditingTransaction({
                  ...editingTransaction,
                  status: newStatus
                });
              }
            }}
            {...(() => {
              const convertEntries = (entries: EmbeddedAccountingEntry[]): EmbeddedAccountingEntryFormData[] => {
                return Array.isArray(entries) ? entries.map(entry => ({
                  _id: entry._id,
                  sequence: entry.sequence || 1,
                  accountId: typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id || '',
                  debitAmount: entry.debitAmount || 0,
                  creditAmount: entry.creditAmount || 0,
                  description: entry.description || '',
                  sourceTransactionId: entry.sourceTransactionId || '',
                  fundingPath: entry.fundingPath || []
                })) : [];
              };

              const initialData = editingTransaction ? {
                description: editingTransaction.description,
                transactionDate: safeDateConvert(editingTransaction.transactionDate),
                organizationId: editingTransaction.organizationId || '',
                receiptUrl: editingTransaction.receiptUrl || '',
                invoiceNo: editingTransaction.invoiceNo || '',
                entries: convertEntries(editingTransaction.entries || []),
                linkedTransactionIds: editingTransaction.linkedTransactionIds,
                sourceTransactionId: editingTransaction.sourceTransactionId || '',
                fundingType: editingTransaction.fundingType || 'original'
              } : copyingTransaction ? {
                description: '',
                transactionDate: new Date(),
                organizationId: copyingTransaction.organizationId || '',
                receiptUrl: '',
                invoiceNo: '',
                entries: convertEntries(copyingTransaction.entries || []),
                linkedTransactionIds: [],
                sourceTransactionId: '',
                fundingType: 'original' as const
              } : null;

              return initialData ? { initialData } : {};
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

      {/* 檢視交易詳情對話框 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          交易詳情
        </DialogTitle>
        <DialogContent>
          {viewingTransaction && (
            <TransactionGroupFormWithEntries
              mode="view"
              transactionId={viewingTransaction._id}
              currentStatus={viewingTransaction.status}
              initialData={(() => {
                const convertEntries = (entries: EmbeddedAccountingEntry[]): EmbeddedAccountingEntryFormData[] => {
                  return Array.isArray(entries) ? entries.map(entry => ({
                    _id: entry._id,
                    sequence: entry.sequence || 1,
                    accountId: typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id || '',
                    debitAmount: entry.debitAmount || 0,
                    creditAmount: entry.creditAmount || 0,
                    description: entry.description || '',
                    sourceTransactionId: entry.sourceTransactionId || '',
                    fundingPath: entry.fundingPath || []
                  })) : [];
                };
  
                return {
                  description: viewingTransaction.description,
                  transactionDate: safeDateConvert(viewingTransaction.transactionDate),
                  organizationId: viewingTransaction.organizationId || '',
                  receiptUrl: viewingTransaction.receiptUrl || '',
                  invoiceNo: viewingTransaction.invoiceNo || '',
                  entries: convertEntries(viewingTransaction.entries || []),
                  linkedTransactionIds: viewingTransaction.linkedTransactionIds,
                  sourceTransactionId: viewingTransaction.sourceTransactionId || '',
                  fundingType: viewingTransaction.fundingType || 'original'
                };
              })()}
              onSubmit={async (_data: TransactionGroupWithEntriesFormData) => {}} // 檢視模式不需要提交
              onCancel={handleCloseDetailDialog}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>
            關閉
          </Button>
          {viewingTransaction && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  handleCloseDetailDialog();
                  handleCopy(viewingTransaction);
                }}
              >
                複製
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleCloseDetailDialog();
                  handleEdit(viewingTransaction);
                }}
              >
                編輯
              </Button>
            </>
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

export default Accounting3TransactionPage;