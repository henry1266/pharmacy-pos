/**
 * 記帳儀表板 Hook (RTK Query 版本)
 * 
 * @description 使用 RTK Query 處理儀表板的記帳相關邏輯，包括記帳記錄的獲取、編輯、刪除和解鎖
 */
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  useGetAccountingDashboardQuery,
  useUpdateAccountingRecordMutation,
  useDeleteAccountingRecordMutation
} from '../api/dashboardApi';
import { 
  setSelectedDate, 
  selectSelectedDate,
  setFormData,
  setIsEditing,
  setCurrentId,
  setFormLoading,
  setShowConfirmDialog,
  setConfirmDialogType,
  resetAccountingForm,
  showNotification,
  selectFormData,
  selectIsEditing,
  selectCurrentId,
  selectFormLoading,
  selectShowConfirmDialog,
  selectConfirmDialogType
} from '../model/dashboardSlice';
import type { ExtendedAccountingRecord, FormData, AccountingItem } from '@pharmacy-pos/shared/types/accounting';
import type { AccountingRecord } from '@pharmacy-pos/shared/types/entities';

/**
 * 記帳儀表板 Hook
 * 
 * @description 處理儀表板的記帳相關邏輯，包括記帳記錄的獲取、編輯、刪除和解鎖
 * 
 * @param {Object} params - 參數對象
 * @param {string} params.startDate - 開始日期，格式為 'YYYY-MM-DD'，如果為空則使用 Redux 中的選中日期
 * @param {string} params.endDate - 結束日期，格式為 'YYYY-MM-DD'，如果為空則使用開始日期
 * @returns {Object} 記帳相關的狀態和函數
 * 
 * @example
 * ```tsx
 * const { 
 *   accountingData, 
 *   loading, 
 *   error, 
 *   formData,
 *   isEditing,
 *   formLoading,
 *   handleEditRecord,
 *   handleDeleteRecord,
 *   handleUnlockRecord,
 *   handleSubmit,
 *   handleCloseEditDialog,
 *   // ... 其他屬性和方法
 * } = useAccountingDashboard();
 * ```
 */
export const useAccountingDashboard = (params?: { startDate?: string; endDate?: string }) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(selectSelectedDate);
  const startDate = params?.startDate || selectedDate;
  const endDate = params?.endDate || startDate;
  
  // 從 Redux 獲取表單狀態
  const formData = useSelector(selectFormData);
  const isEditing = useSelector(selectIsEditing);
  const currentId = useSelector(selectCurrentId);
  const formLoading = useSelector(selectFormLoading);
  const showConfirmDialog = useSelector(selectShowConfirmDialog);
  const confirmDialogType = useSelector(selectConfirmDialogType);
  
  // 使用 RTK Query 獲取記帳儀表板數據
  const {
    data: accountingData,
    isLoading: loading,
    isError,
    error: queryError,
    refetch
  } = useGetAccountingDashboardQuery(
    { 
      startDate, 
      endDate
    },
    { skip: !startDate }
  );
  
  // 使用 RTK Query 的更新記帳記錄 mutation
  const [updateAccountingRecord, { isLoading: isUpdating }] = useUpdateAccountingRecordMutation();
  
  // 使用 RTK Query 的刪除記帳記錄 mutation
  const [deleteAccountingRecord, { isLoading: isDeleting }] = useDeleteAccountingRecordMutation();
  
  // 從 queryError 中提取錯誤信息
  const errorMessage = isError 
    ? (queryError as any)?.data?.message || (queryError as any)?.message || '載入記帳數據失敗'
    : undefined;
  
  // 更改日期的函數
  const changeDate = useCallback((newDate: string) => {
    dispatch(setSelectedDate(newDate));
  }, [dispatch]);
  
  /**
   * 顯示通知訊息
   * 
   * @param {string} message - 要顯示的訊息內容
   * @param {'success' | 'error' | 'info' | 'warning'} type - 訊息的嚴重性級別
   * @returns {void}
   */
  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning'): void => {
    dispatch(showNotification({ message, type }));
  }, [dispatch]);
  
  /**
   * 處理編輯記帳記錄
   * 
   * @param {ExtendedAccountingRecord} record - 要編輯的記帳記錄
   * @returns {Promise<void>}
   */
  const handleEditRecord = useCallback(async (record: ExtendedAccountingRecord) => {
    dispatch(setFormLoading(true));
    dispatch(setIsEditing(true));
    dispatch(setCurrentId(record._id));
    
    try {
      // 準備表單數據
      const formData: FormData = {
        date: new Date(record.date),
        shift: record.shift || '',
        status: record.status || 'pending',
        items: record.items || [
          { amount: 0, category: '掛號費', note: '' },
          { amount: 0, category: '部分負擔', note: '' }
        ],
        unaccountedSales: record.unaccountedSales || []
      };
      
      dispatch(setFormData(formData));
      dispatch(setShowConfirmDialog(true));
    } catch (error) {
      showSnackbar('載入編輯資料失敗', 'error');
      // 重置狀態
      dispatch(setIsEditing(false));
      dispatch(setCurrentId(null));
    } finally {
      dispatch(setFormLoading(false));
    }
  }, [dispatch, showSnackbar]);
  
  /**
   * 關閉編輯對話框
   * 
   * @returns {void}
   */
  const handleCloseEditDialog = useCallback((): void => {
    dispatch(setShowConfirmDialog(false));
    // 重置表單狀態
    dispatch(resetAccountingForm());
  }, [dispatch]);
  
  /**
   * 處理表單提交
   * 
   * @returns {Promise<void>}
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    // 基本驗證
    if (!formData.date || !formData.shift) {
      showSnackbar('請選擇日期和班別', 'error');
      return;
    }
    const validItems = formData.items.filter((item: AccountingItem) => item.amount && item.category);
    if (validItems.length === 0) {
      showSnackbar('至少需要一個有效的項目', 'error');
      return;
    }
    
    dispatch(setFormLoading(true));
    
    try {
      const submitData = {
        ...formData,
        items: validItems // 只提交有效項目
      };
      
      if (isEditing && currentId) {
        // 使用 RTK Query 更新記帳記錄
        await updateAccountingRecord({
          id: currentId,
          data: submitData as Partial<AccountingRecord>
        }).unwrap();
        
        showSnackbar('記帳記錄已更新', 'success');
        handleCloseEditDialog();
        refetch(); // 重新獲取記錄
      }
    } catch (err: any) {
      console.error('提交記帳記錄失敗:', err);
      showSnackbar(err.message ?? '提交記帳記錄失敗', 'error');
    } finally {
      dispatch(setFormLoading(false));
    }
  }, [currentId, dispatch, formData, handleCloseEditDialog, isEditing, refetch, showSnackbar, updateAccountingRecord]);
  
  /**
   * 處理刪除記帳記錄
   * 
   * @param {string} id - 要刪除的記帳記錄 ID
   * @returns {Promise<void>}
   */
  const handleDeleteRecord = useCallback(async (id: string) => {
    if (window.confirm('確定要刪除此記帳記錄嗎？')) {
      try {
        // 使用 RTK Query 刪除記帳記錄
        await deleteAccountingRecord(id).unwrap();
        showSnackbar('記帳記錄已刪除', 'success');
        refetch(); // 重新獲取記錄
      } catch (error: any) {
        console.error('刪除記帳記錄失敗:', error);
        showSnackbar(error.message ?? '刪除記帳記錄失敗', 'error');
      }
    }
  }, [deleteAccountingRecord, refetch, showSnackbar]);
  
  /**
   * 處理解鎖記帳記錄
   * 
   * @param {ExtendedAccountingRecord} record - 要解鎖的記帳記錄
   * @returns {Promise<void>}
   */
  const handleUnlockRecord = useCallback(async (record: ExtendedAccountingRecord) => {
    if (window.confirm('確定要解鎖此記帳記錄並改為待處理狀態嗎？')) {
      try {
        // 使用 RTK Query 更新記帳記錄
        await updateAccountingRecord({
          id: record._id,
          data: { status: 'pending' } as Partial<AccountingRecord>
        }).unwrap();
        
        showSnackbar('記帳記錄已解鎖', 'success');
        refetch(); // 重新獲取記錄
      } catch (error: any) {
        console.error('解鎖記帳記錄失敗:', error);
        showSnackbar(error.message ?? '解鎖記帳記錄失敗', 'error');
      }
    }
  }, [refetch, showSnackbar, updateAccountingRecord]);
  
  return {
    // 狀態
    accountingData,
    loading: loading || isUpdating || isDeleting,
    error: errorMessage,
    formData,
    isEditing,
    currentId,
    formLoading,
    showConfirmDialog,
    confirmDialogType,
    
    // 方法
    changeDate,
    refetch,
    handleEditRecord,
    handleCloseEditDialog,
    handleSubmit,
    handleDeleteRecord,
    handleUnlockRecord,
    showSnackbar
  };
};

export default useAccountingDashboard;