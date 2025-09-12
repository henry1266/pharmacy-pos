import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../../../hooks/redux';
import {
  createTransactionGroupWithEntries,
  fetchAccounts2,
  fetchOrganizations2
} from '../../../../../redux/actions';
import { 
  TransactionGroupWithEntriesFormData,
  SnackbarState,
  TransactionApiData
} from '../types';
import { safeDateConvert } from '../../../transactions/utils/dateUtils';

/**
 * 交易新增頁面的主要 Hook
 * 處理頁面狀態、數據加載和事件處理
 */
export const useTransactionNewPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL 查詢參數
  const defaultAccountId = searchParams.get('defaultAccountId');
  const defaultOrganizationId = searchParams.get('defaultOrganizationId');
  
  // Redux 狀態
  const { loading, error } = useAppSelector(state => state.transactionGroupWithEntries);
  
  // 本地狀態
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 數據加載函數
  const loadInitialData = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Accounting3TransactionNewPage 初始化載入資料');
    }
    
    // 使用 Promise.all 並行加載數據
    await Promise.all([
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

  // 處理取消新增
  const handleCancel = () => {
    navigate('/accounting3/transaction');
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
      status: 'draft' // 新增模式下設為草稿
    } as TransactionApiData;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [Accounting3] 轉換後的 API 資料:', {
        ...converted,
        entries: (converted.entries || []).map(entry => ({
          accountId: entry.accountId,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          description: entry.description
        }))
      });
    }
    
    return converted;
  };

  // 處理表單提交
  const handleFormSubmit = async (formData: TransactionGroupWithEntriesFormData) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [Accounting3] handleFormSubmit 開始:', {
          mode: 'create',
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🆕 [Accounting3] 執行建立操作');
      }
      
      const createResult = await dispatch(createTransactionGroupWithEntries(apiData) as any);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [Accounting3] 建立操作完成:', createResult);
      }
      
      showSnackbar('交易已成功建立', 'success');
      
      // 延遲導航，讓用戶看到成功消息
      setTimeout(() => {
        navigate('/accounting3/transaction');
      }, 1500);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [Accounting3] 表單提交失敗:', error);
        console.error('❌ [Accounting3] 錯誤詳情:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          formDataSummary: {
            description: formData.description,
            organizationId: formData.organizationId,
            entriesCount: formData.entries?.length || 0
          }
        });
      }
      
      // 根據錯誤類型顯示更具體的錯誤訊息
      let errorMessage = '建立交易失敗';
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

  return {
    // 狀態
    loading,
    error,
    snackbar,
    
    // URL 參數
    defaultAccountId,
    defaultOrganizationId,
    
    // 事件處理函數
    handleFormSubmit,
    handleCancel,
    handleCloseSnackbar,
    
    // 工具函數
    safeDateConvert,
    convertFormDataToApiData,
    
    // 導航
    navigate
  };
};

export default useTransactionNewPage;