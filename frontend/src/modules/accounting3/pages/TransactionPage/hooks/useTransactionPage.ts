import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../../../hooks/redux';
import {
  fetchTransactionGroupsWithEntries,
  createTransactionGroupWithEntries,
  updateTransactionGroupWithEntries,
  deleteTransactionGroupWithEntries,
  confirmTransactionGroupWithEntries,
  unlockTransactionGroupWithEntries,
  fetchAccounts2,
  fetchOrganizations2
} from '../../../../../redux/actions';
import { 
  TransactionGroupWithEntries, 
  TransactionGroupWithEntriesFormData,
  SnackbarState,
  TransactionApiData,
  TransactionUpdateData
} from '../types';
import { safeDateConvert } from '../utils/dateUtils';

/**
 * 交易頁面的主要 Hook
 * 處理頁面狀態、數據加載和事件處理
 */
export const useTransactionPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { transactionId } = useParams<{ transactionId?: string }>();
  
  // 頁面模式
  const isCopyMode = window.location.pathname.includes('/copy');
  const isNewMode = window.location.pathname.includes('/new');
  
  // URL 查詢參數
  const returnTo = searchParams.get('returnTo');
  const defaultAccountId = searchParams.get('defaultAccountId');
  const defaultOrganizationId = searchParams.get('defaultOrganizationId');
  
  // Redux 狀態
  const { transactionGroups, loading, error, pagination } = useAppSelector(state => state.transactionGroupWithEntries);
  
  // 本地狀態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [copyingTransaction, setCopyingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 數據加載函數
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

  // 轉換表單資料為 API 資料
  const convertFormDataToApiData = (data: TransactionGroupWithEntriesFormData): TransactionApiData => {
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
    } as TransactionApiData;
    
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
      
      const apiData = convertFormDataToApiData(formData);
      
      if (editingTransaction) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 [Accounting3] 執行更新操作:', editingTransaction._id);
        }
        
        // 對於更新操作，使用 Partial 類型
        const updateData: TransactionUpdateData = {
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

  // 生命週期 hooks
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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

  return {
    // 狀態
    transactionGroups,
    loading,
    error,
    pagination,
    dialogOpen,
    detailDialogOpen,
    editingTransaction,
    copyingTransaction,
    viewingTransaction,
    showFilters,
    searchTerm,
    snackbar,
    isNewMode,
    isCopyMode,
    
    // URL 參數
    transactionId,
    returnTo,
    defaultAccountId,
    defaultOrganizationId,
    
    // 事件處理函數
    setSearchTerm,
    setShowFilters,
    handleCreateNew,
    handleEdit,
    handleView,
    handleDelete,
    handleCopy,
    handleConfirm,
    handleUnlock,
    handleFormSubmit,
    handleCloseDialog,
    handleCloseDetailDialog,
    handleCloseSnackbar,
    
    // 工具函數
    safeDateConvert,
    convertFormDataToApiData,
    
    // 導航
    navigate
  };
};

export default useTransactionPage;