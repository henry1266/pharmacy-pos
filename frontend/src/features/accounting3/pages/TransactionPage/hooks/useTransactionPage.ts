import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../../../hooks/redux';
import {
  fetchTransactionGroupsWithEntries,
  deleteTransactionGroupWithEntries,
  confirmTransactionGroupWithEntries,
  unlockTransactionGroupWithEntries,
  fetchAccounts2,
  fetchOrganizations2
} from '../../../../../redux/actions';
import { 
  TransactionGroupWithEntries, 
  SnackbarState
} from '../types';
import { safeDateConvert } from '../../../transactions/utils/dateUtils';

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
  const defaultAccountId = searchParams.get('defaultAccountId');
  const defaultOrganizationId = searchParams.get('defaultOrganizationId');
  
  // Redux 狀態
  const { transactionGroups, loading, error, pagination } = useAppSelector(state => state.transactionGroupWithEntries);
  
  // 本地狀態
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

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 關閉通知
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 處理新增交易 - 在新分頁中打開新增頁面
  const handleCreateNew = () => {
    // 在新分頁中打開新增頁面
    window.open(`/accounting3/transaction/new`, '_blank');
  };

  // 處理編輯交易 - 在新分頁中打開編輯頁面
  const handleEdit = (transactionGroup: TransactionGroupWithEntries) => {
    // 在新分頁中打開編輯頁面
    window.open(`/accounting3/transaction/${transactionGroup._id}/edit`, '_blank');
  };

  // 處理檢視交易 - 在新分頁中打開詳情頁面
  const handleView = (transactionGroup: TransactionGroupWithEntries) => {
    // 在新分頁中打開詳情頁面
    window.open(`/accounting3/transaction/${transactionGroup._id}`, '_blank');
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

  // 處理複製交易 - 在新分頁中打開複製頁面
  const handleCopy = (transactionGroup: TransactionGroupWithEntries) => {
    // 在新分頁中打開複製頁面
    window.open(`/accounting3/transaction/${transactionGroup._id}/copy`, '_blank');
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

  // 如果 URL 中有 transactionId 參數，則在新分頁中打開相應的頁面
  useEffect(() => {
    if (transactionId && transactionGroups.length > 0) {
      // 根據模式在新分頁中打開相應的頁面
      if (isCopyMode) {
        window.open(`/accounting3/transaction/${transactionId}/copy`, '_blank');
      } else if (isNewMode) {
        window.open(`/accounting3/transaction/new`, '_blank');
      } else {
        window.open(`/accounting3/transaction/${transactionId}/edit`, '_blank');
      }
      
      // 導航回交易列表頁面
      navigate('/accounting3/transaction');
    }
  }, [transactionId, transactionGroups, isCopyMode, isNewMode, navigate]);

  // 如果 URL 中有 defaultAccountId 參數，則在新分頁中打開新增頁面
  useEffect(() => {
    if (defaultAccountId && !transactionId) {
      // 在新分頁中打開新增頁面
      window.open(`/accounting3/transaction/new?defaultAccountId=${defaultAccountId}&defaultOrganizationId=${defaultOrganizationId || ''}`, '_blank');
      
      // 導航回交易列表頁面
      navigate('/accounting3/transaction');
    }
  }, [defaultAccountId, defaultOrganizationId, transactionId, navigate]);

  return {
    // 狀態
    transactionGroups,
    loading,
    error,
    pagination,
    showFilters,
    searchTerm,
    snackbar,
    isNewMode,
    isCopyMode,
    
    // URL 參數
    transactionId,
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
    handleCloseSnackbar,
    
    // 工具函數
    safeDateConvert,
    
    // 導航
    navigate
  };
};

export default useTransactionPage;