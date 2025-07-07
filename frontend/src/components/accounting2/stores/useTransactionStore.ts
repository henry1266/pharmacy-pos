import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { 
  TransactionGroupWithEntriesFormData,
  EmbeddedAccountingEntryFormData,
  TransactionGroupWithEntries
} from '@pharmacy-pos/shared';
import { transactionGroupWithEntriesService } from '../../../services/transactionGroupWithEntriesService';
import { convertBackendDataToFormData, createDefaultEntries } from '../utils/dataConverters';
import { validateTransactionForm, ValidationResult } from '../utils/formValidation';

// 通知狀態介面
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// 分頁狀態介面
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 篩選狀態介面
interface FilterState {
  organizationId?: string;
  status?: 'draft' | 'confirmed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

// Store Hook 回傳值介面
interface UseTransactionStoreReturn {
  // Redux 狀態
  transactionGroups: TransactionGroupWithEntries[];
  currentTransactionGroup: TransactionGroupWithEntries | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationState | null;
  
  // 本地狀態
  notification: NotificationState;
  filters: FilterState;
  
  // 表單狀態
  formData: TransactionGroupWithEntriesFormData;
  validation: ValidationResult;
  isFormValid: boolean;
  
  // 動作函數
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  setFormData: React.Dispatch<React.SetStateAction<TransactionGroupWithEntriesFormData>>;
  
  // 載入函數
  loadTransactionGroups: (params?: Partial<FilterState & PaginationState>) => Promise<void>;
  loadTransactionGroup: (id: string) => Promise<void>;
  
  // CRUD 函數
  createTransactionGroup: (data: TransactionGroupWithEntriesFormData) => Promise<boolean>;
  updateTransactionGroup: (id: string, data: TransactionGroupWithEntriesFormData) => Promise<boolean>;
  deleteTransactionGroup: (id: string) => Promise<boolean>;
  
  // 表單函數
  initializeForm: (data?: Partial<TransactionGroupWithEntriesFormData>, isCopyMode?: boolean) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  handleBasicInfoChange: (field: keyof TransactionGroupWithEntriesFormData, value: any) => void;
  handleEntriesChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  
  // 通知函數
  showNotification: (message: string, severity: NotificationState['severity']) => void;
  closeNotification: () => void;
  
  // 篩選後的資料
  filteredTransactionGroups: TransactionGroupWithEntries[];
}

export const useTransactionStore = (): UseTransactionStoreReturn => {
  const dispatch = useAppDispatch();
  
  // Redux 狀態
  const { 
    transactionGroups, 
    currentTransactionGroup, 
    loading, 
    error, 
    pagination 
  } = useAppSelector(state => state.transactionGroupWithEntries);
  
  // 本地狀態
  const [localState, setLocalState] = useState({
    notification: {
      open: false,
      message: '',
      severity: 'info' as const
    } as NotificationState,
    filters: {} as FilterState,
    formData: {
      description: '',
      transactionDate: new Date(),
      organizationId: undefined,
      receiptUrl: '',
      invoiceNo: '',
      entries: createDefaultEntries()
    } as TransactionGroupWithEntriesFormData,
    validation: {
      isValid: true,
      errors: {},
      balanceError: ''
    } as ValidationResult
  });

  // 載入交易群組列表
  const loadTransactionGroups = useCallback(async (params?: Partial<FilterState & PaginationState>) => {
    try {
      dispatch({ type: 'FETCH_TRANSACTION_GROUPS_WITH_ENTRIES_REQUEST' });
      
      const queryParams = {
        ...localState.filters,
        ...params,
        page: params?.page || 1,
        limit: params?.limit || 20
      };
      
      console.log('📊 載入交易群組列表，參數:', queryParams);
      
      const response = await transactionGroupWithEntriesService.getAll(queryParams);
      
      if (response.success && response.data) {
        dispatch({
          type: 'FETCH_TRANSACTION_GROUPS_WITH_ENTRIES_SUCCESS',
          payload: {
            groups: response.data.groups || [],
            pagination: response.data.pagination || null
          }
        });
        console.log('📊 交易群組列表載入完成:', response.data.groups?.length || 0);
      } else {
        throw new Error('載入交易群組列表失敗');
      }
    } catch (error) {
      console.error('❌ 載入交易群組列表失敗:', error);
      dispatch({
        type: 'FETCH_TRANSACTION_GROUPS_WITH_ENTRIES_FAILURE',
        payload: '載入交易群組列表失敗'
      });
    }
  }, [dispatch, localState.filters]);

  // 載入單一交易群組
  const loadTransactionGroup = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'FETCH_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST' });
      
      console.log('📋 載入交易群組詳情，ID:', id);
      
      const response = await transactionGroupWithEntriesService.getById(id);
      
      if (response.success && response.data) {
        dispatch({
          type: 'FETCH_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS',
          payload: response.data
        });
        console.log('📋 交易群組詳情載入完成');
      } else {
        throw new Error('載入交易群組詳情失敗');
      }
    } catch (error) {
      console.error('❌ 載入交易群組詳情失敗:', error);
      dispatch({
        type: 'FETCH_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE',
        payload: '載入交易群組詳情失敗'
      });
    }
  }, [dispatch]);

  // 建立交易群組
  const createTransactionGroup = useCallback(async (data: TransactionGroupWithEntriesFormData): Promise<boolean> => {
    try {
      dispatch({ type: 'CREATE_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST' });
      
      console.log('📤 建立交易群組，資料:', data);
      
      const response = await transactionGroupWithEntriesService.create(data);
      
      if (response.success && response.data) {
        dispatch({
          type: 'CREATE_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS',
          payload: response.data
        });
        
        setLocalState(prev => ({
          ...prev,
          notification: {
            open: true,
            message: '交易群組建立成功',
            severity: 'success'
          }
        }));
        
        console.log('✅ 交易群組建立成功');
        return true;
      } else {
        throw new Error('建立交易群組失敗');
      }
    } catch (error) {
      console.error('❌ 建立交易群組失敗:', error);
      dispatch({
        type: 'CREATE_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE',
        payload: '建立交易群組失敗'
      });
      
      setLocalState(prev => ({
        ...prev,
        notification: {
          open: true,
          message: '建立交易群組失敗',
          severity: 'error'
        }
      }));
      
      return false;
    }
  }, [dispatch]);

  // 更新交易群組
  const updateTransactionGroup = useCallback(async (id: string, data: TransactionGroupWithEntriesFormData): Promise<boolean> => {
    try {
      dispatch({ type: 'UPDATE_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST' });
      
      console.log('📤 更新交易群組，ID:', id, '資料:', data);
      
      const response = await transactionGroupWithEntriesService.update(id, data);
      
      if (response.success && response.data) {
        dispatch({
          type: 'UPDATE_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS',
          payload: response.data
        });
        
        setLocalState(prev => ({
          ...prev,
          notification: {
            open: true,
            message: '交易群組更新成功',
            severity: 'success'
          }
        }));
        
        console.log('✅ 交易群組更新成功');
        return true;
      } else {
        throw new Error('更新交易群組失敗');
      }
    } catch (error) {
      console.error('❌ 更新交易群組失敗:', error);
      dispatch({
        type: 'UPDATE_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE',
        payload: '更新交易群組失敗'
      });
      
      setLocalState(prev => ({
        ...prev,
        notification: {
          open: true,
          message: '更新交易群組失敗',
          severity: 'error'
        }
      }));
      
      return false;
    }
  }, [dispatch]);

  // 刪除交易群組
  const deleteTransactionGroup = useCallback(async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'DELETE_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST' });
      
      console.log('🗑️ 刪除交易群組，ID:', id);
      
      const response = await transactionGroupWithEntriesService.delete(id);
      
      if (response.success) {
        dispatch({
          type: 'DELETE_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS',
          payload: id
        });
        
        setLocalState(prev => ({
          ...prev,
          notification: {
            open: true,
            message: '交易群組刪除成功',
            severity: 'success'
          }
        }));
        
        console.log('✅ 交易群組刪除成功');
        return true;
      } else {
        throw new Error('刪除交易群組失敗');
      }
    } catch (error) {
      console.error('❌ 刪除交易群組失敗:', error);
      dispatch({
        type: 'DELETE_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE',
        payload: '刪除交易群組失敗'
      });
      
      setLocalState(prev => ({
        ...prev,
        notification: {
          open: true,
          message: '刪除交易群組失敗',
          severity: 'error'
        }
      }));
      
      return false;
    }
  }, [dispatch]);

  // 初始化表單
  const initializeForm = useCallback((data?: Partial<TransactionGroupWithEntriesFormData>, isCopyMode = false) => {
    console.log('🏗️ 初始化表單，資料:', data, '複製模式:', isCopyMode);
    
    if (data && Object.keys(data).length > 0) {
      try {
        const convertedData = convertBackendDataToFormData(data);
        const entries = convertedData.entries && Array.isArray(convertedData.entries) && convertedData.entries.length >= 2
          ? convertedData.entries
          : createDefaultEntries();
        
        const formData: TransactionGroupWithEntriesFormData = {
          description: isCopyMode ? '' : (convertedData.description || ''),
          transactionDate: convertedData.transactionDate || new Date(),
          organizationId: convertedData.organizationId,
          receiptUrl: convertedData.receiptUrl || '',
          invoiceNo: convertedData.invoiceNo || '',
          entries,
          linkedTransactionIds: isCopyMode ? undefined : convertedData.linkedTransactionIds,
          sourceTransactionId: isCopyMode ? undefined : convertedData.sourceTransactionId,
          fundingType: isCopyMode ? 'original' : (convertedData.fundingType || 'original')
        };
        
        setLocalState(prev => ({
          ...prev,
          formData,
          validation: {
            isValid: true,
            errors: {},
            balanceError: ''
          }
        }));
        
        console.log('🎯 表單初始化完成:', formData);
      } catch (error) {
        console.error('❌ 表單初始化失敗:', error);
        resetForm();
      }
    } else {
      resetForm();
    }
  }, []);

  // 驗證表單
  const validateFormData = useCallback((): boolean => {
    const result = validateTransactionForm(localState.formData, 'create');
    setLocalState(prev => ({
      ...prev,
      validation: result
    }));
    return result.isValid;
  }, [localState.formData]);

  // 重置表單
  const resetForm = useCallback(() => {
    setLocalState(prev => ({
      ...prev,
      formData: {
        description: '',
        transactionDate: new Date(),
        organizationId: undefined,
        receiptUrl: '',
        invoiceNo: '',
        entries: createDefaultEntries()
      },
      validation: {
        isValid: true,
        errors: {},
        balanceError: ''
      }
    }));
  }, []);

  // 處理基本資訊變更
  const handleBasicInfoChange = useCallback((field: keyof TransactionGroupWithEntriesFormData, value: any) => {
    setLocalState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      },
      validation: {
        ...prev.validation,
        errors: {
          ...prev.validation.errors,
          [field]: undefined
        }
      }
    }));
  }, []);

  // 處理分錄變更
  const handleEntriesChange = useCallback((entries: EmbeddedAccountingEntryFormData[]) => {
    setLocalState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        entries
      },
      validation: {
        ...prev.validation,
        errors: {
          ...prev.validation.errors,
          entries: undefined
        },
        balanceError: ''
      }
    }));
  }, []);

  // 設定篩選條件
  const setFilters = useCallback((filters: Partial<FilterState>) => {
    setLocalState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...filters
      }
    }));
  }, []);

  // 清除篩選條件
  const clearFilters = useCallback(() => {
    setLocalState(prev => ({
      ...prev,
      filters: {}
    }));
  }, []);

  // 通知函數
  const showNotification = useCallback((message: string, severity: NotificationState['severity']) => {
    setLocalState(prev => ({
      ...prev,
      notification: {
        open: true,
        message,
        severity
      }
    }));
  }, []);

  const closeNotification = useCallback(() => {
    setLocalState(prev => ({
      ...prev,
      notification: { ...prev.notification, open: false }
    }));
  }, []);

  // 篩選後的交易群組
  const filteredTransactionGroups = useMemo(() => {
    return transactionGroups.filter(group => {
      const matchesSearch = !localState.filters.searchTerm || 
        group.description.toLowerCase().includes(localState.filters.searchTerm.toLowerCase()) ||
        group.groupNumber?.toLowerCase().includes(localState.filters.searchTerm.toLowerCase());
      
      const matchesStatus = !localState.filters.status || 
        group.status === localState.filters.status;
      
      const matchesOrganization = !localState.filters.organizationId || 
        group.organizationId === localState.filters.organizationId;
      
      return matchesSearch && matchesStatus && matchesOrganization;
    });
  }, [transactionGroups, localState.filters]);

  // 計算表單是否有效
  const isFormValid = localState.validation.isValid && 
    Object.keys(localState.validation.errors).length === 0 && 
    !localState.validation.balanceError;

  // 初始化載入
  useEffect(() => {
    loadTransactionGroups();
  }, []); // 只在組件掛載時執行一次

  // 監聽錯誤狀態
  useEffect(() => {
    if (error) {
      setLocalState(prev => ({
        ...prev,
        notification: {
          open: true,
          message: error,
          severity: 'error'
        }
      }));
    }
  }, [error]);

  return {
    // Redux 狀態
    transactionGroups,
    currentTransactionGroup,
    loading,
    error,
    pagination,
    
    // 本地狀態
    notification: localState.notification,
    filters: localState.filters,
    
    // 表單狀態
    formData: localState.formData,
    validation: localState.validation,
    isFormValid,
    
    // 動作函數
    setFilters,
    clearFilters,
    setFormData: (formData) => setLocalState(prev => ({ ...prev, formData: typeof formData === 'function' ? formData(prev.formData) : formData })),
    
    // 載入函數
    loadTransactionGroups,
    loadTransactionGroup,
    
    // CRUD 函數
    createTransactionGroup,
    updateTransactionGroup,
    deleteTransactionGroup,
    
    // 表單函數
    initializeForm,
    validateForm: validateFormData,
    resetForm,
    handleBasicInfoChange,
    handleEntriesChange,
    
    // 通知函數
    showNotification,
    closeNotification,
    
    // 篩選後的資料
    filteredTransactionGroups
  };
};

export default useTransactionStore;