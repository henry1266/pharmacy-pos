import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../../hooks/redux';
import {
  createTransactionGroupWithEntries,
  fetchAccounts2,
  fetchOrganizations2
} from '../../../../redux/actions';
import { 
  TransactionGroupWithEntries,
  TransactionGroupWithEntriesFormData,
  SnackbarState,
  TransactionApiData
} from '../../payments/types';
import { safeDateConvert } from '../utils/dateUtils';

/**
 * 交易複製頁面的主要 Hook
 *
 * 處理交易複製頁面的狀態管理、數據加載和事件處理。
 * 此 Hook 負責從 Redux store 或 API 獲取原始交易資料，處理複製表單提交，
 * 並管理頁面的各種狀態（載入中、錯誤、通知等）。
 *
 * 功能：
 * - 從 Redux store 或 API 載入原始交易資料
 * - 處理複製表單提交和資料驗證
 * - 管理頁面狀態（載入中、錯誤、通知等）
 * - 處理交易複製和建立操作
 * - 提供取消複製的功能
 *
 * @returns {object} 包含頁面狀態和事件處理函數的物件
 * @returns {TransactionGroupWithEntries | null} return.copyingTransaction - 正在複製的交易資料
 * @returns {boolean} return.loading - 載入狀態
 * @returns {string | null} return.error - 錯誤訊息
 * @returns {object} return.snackbar - 通知狀態
 * @returns {string | undefined} return.transactionId - 原始交易 ID
 * @returns {function} return.handleFormSubmit - 處理表單提交的函數
 * @returns {function} return.handleCancel - 處理取消複製的函數
 * @returns {function} return.handleCloseSnackbar - 處理關閉通知的函數
 * @returns {function} return.safeDateConvert - 安全的日期轉換函數
 * @returns {function} return.convertFormDataToApiData - 轉換表單資料為 API 資料的函數
 * @returns {object} return.navigate - React Router 的 navigate 函數
 *
 * @example
 * // 在交易複製頁面中使用
 * const {
 *   copyingTransaction,
 *   loading,
 *   error,
 *   handleFormSubmit,
 *   handleCancel
 * } = useTransactionCopyPage();
 *
 * if (loading) {
 *   return <LoadingIndicator />;
 * }
 *
 * return (
 *   <TransactionForm
 *     initialData={copyingTransaction}
 *     onSubmit={handleFormSubmit}
 *     onCancel={handleCancel}
 *   />
 * );
 */
export const useTransactionCopyPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const [searchParams] = useSearchParams();
  
  // URL 查詢參數
  
  // Redux 狀態
  const { transactionGroups, loading, error } = useAppSelector(state => state.transactionGroupWithEntries);
  
  // 本地狀態
  const [copyingTransaction, setCopyingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  /**
   * 直接透過 API 獲取單一交易
   *
   * 當 Redux store 中找不到指定交易時，直接從 API 獲取交易詳細資料。
   * 處理 API 請求、回應解析和錯誤處理，並更新本地狀態。
   *
   * @param {string} id - 要獲取的交易 ID
   * @returns {Promise<void>}
   */
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
          
          setCopyingTransaction(transaction);
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

  /**
   * 載入初始資料
   *
   * 並行載入交易複製頁面所需的基礎資料，包括科目和組織資料。
   * 使用 Promise.all 優化載入效能。
   *
   * @returns {Promise<void>}
   */
  const loadInitialData = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Accounting3TransactionCopyPage 初始化載入資料');
    }
    
    // 使用 Promise.all 並行加載數據
    await Promise.all([
      dispatch(fetchAccounts2() as any),
      dispatch(fetchOrganizations2() as any)
    ]);
  }, [dispatch]);

  /**
   * 顯示通知訊息
   *
   * 更新 snackbar 狀態，顯示指定的訊息和嚴重性。
   * 用於向用戶提供操作結果的反饋。
   *
   * @param {string} message - 要顯示的通知訊息
   * @param {'success' | 'error' | 'warning' | 'info'} severity - 通知的嚴重性
   */
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  /**
   * 關閉通知訊息
   *
   * 更新 snackbar 狀態，關閉當前顯示的通知。
   * 保留通知的訊息和嚴重性，僅更改顯示狀態。
   */
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  /**
   * 處理取消複製操作
   *
   * 導航回交易列表頁面，放棄當前的複製操作。
   * 不會提示用戶確認，直接執行導航。
   */
  const handleCancel = () => {
    navigate('/accounting3/transaction');
  };

  /**
   * 轉換表單資料為 API 資料格式
   *
   * 將表單收集的資料轉換為符合 API 要求的格式。
   * 處理資料清理、格式轉換和預設值設定。
   * 在複製模式下，特別設定狀態為草稿。
   *
   * @param {TransactionGroupWithEntriesFormData} data - 表單收集的原始資料
   * @returns {TransactionApiData} 轉換後符合 API 格式的資料
   */
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
      status: 'draft' // 複製模式下設為草稿
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

  /**
   * 處理表單提交
   *
   * 驗證表單資料，轉換為 API 格式，並提交建立請求。
   * 處理成功和失敗的情況，顯示適當的通知訊息。
   * 成功時延遲導航回列表頁面，讓用戶看到成功訊息。
   *
   * 驗證包括：
   * - 交易描述不能為空
   * - 至少需要兩筆分錄
   * - 借貸必須平衡
   *
   * @param {TransactionGroupWithEntriesFormData} formData - 表單提交的資料
   * @returns {Promise<void>}
   */
  const handleFormSubmit = async (formData: TransactionGroupWithEntriesFormData) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [Accounting3] handleFormSubmit 開始:', {
          mode: 'copy',
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
        console.log('🆕 [Accounting3] 執行建立操作（複製模式）');
      }
      
      const createResult = await dispatch(createTransactionGroupWithEntries(apiData) as any);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [Accounting3] 建立操作完成:', createResult);
      }
      
      showSnackbar('交易已成功複製並建立', 'success');
      
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
      let errorMessage = '複製交易失敗';
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
    if (transactionId) {
      const transactionToCopy = transactionGroups.find(t => t._id === transactionId);
      
      if (transactionToCopy) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 從 Redux store 獲取複製交易:', transactionToCopy);
        }
        setCopyingTransaction(transactionToCopy);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Redux store 中找不到交易，透過 API 直接獲取:', transactionId);
        }
        fetchTransactionDirectly(transactionId);
      }
    }
  }, [transactionId, transactionGroups]);

  return {
    // 狀態
    copyingTransaction,
    loading,
    error,
    snackbar,
    
    // URL 參數
    transactionId,
    
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

export default useTransactionCopyPage;