import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  FundingSource,
  FundingFlowData,
  FundingValidationData,
  TransactionGroupWithEntries
} from '@pharmacy-pos/shared';
import {
  transactionGroupWithEntriesService,
  embeddedFundingTrackingService
} from '@services/transactionGroupWithEntriesService';

// 通知狀態介面
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// 資金來源篩選狀態介面
interface FundingFilterState {
  organizationId?: string;
  fundingType?: 'original' | 'extended' | 'transfer';
  isAvailable?: boolean;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

// 資金驗證狀態介面
interface FundingValidationState {
  isValidating: boolean;
  validationData: FundingValidationData | null;
  selectedSources: string[];
  requiredAmount: number;
}

// Store Hook 回傳值介面
interface UseFundingStoreReturn {
  // 資金來源狀態
  fundingSources: FundingSource[];
  availableFundingSources: FundingSource[];
  loading: boolean;
  error: string | null;
  
  // 資金流向狀態
  fundingFlowData: FundingFlowData | null;
  flowLoading: boolean;
  
  // 資金驗證狀態
  validation: FundingValidationState;
  
  // 本地狀態
  notification: NotificationState;
  filters: FundingFilterState;
  
  // 載入函數
  loadFundingSources: (params?: Partial<FundingFilterState>) => Promise<void>;
  loadFundingFlow: (transactionId: string) => Promise<void>;
  
  // 資金驗證函數
  validateFundingSources: (sourceIds: string[], requiredAmount: number) => Promise<void>;
  selectFundingSource: (sourceId: string) => void;
  deselectFundingSource: (sourceId: string) => void;
  clearSelectedSources: () => void;
  
  // 篩選函數
  setFilters: (filters: Partial<FundingFilterState>) => void;
  clearFilters: () => void;
  
  // 通知函數
  showNotification: (message: string, severity: NotificationState['severity']) => void;
  closeNotification: () => void;
  
  // 計算函數
  calculateTotalAvailableAmount: () => number;
  calculateSelectedAmount: () => number;
  
  // 篩選後的資料
  filteredFundingSources: FundingSource[];
}

export const useFundingStore = (): UseFundingStoreReturn => {
  const dispatch = useAppDispatch();
  
  // Redux 狀態 (目前沒有專門的 funding reducer，使用 transactionGroupWithEntries)
  const { loading: transactionLoading, error: transactionError } = useAppSelector(
    state => state.transactionGroupWithEntries
  );
  
  // 本地狀態
  const [localState, setLocalState] = useState({
    fundingSources: [] as FundingSource[],
    fundingFlowData: null as FundingFlowData | null,
    loading: false,
    flowLoading: false,
    error: null as string | null,
    notification: {
      open: false,
      message: '',
      severity: 'info' as const
    } as NotificationState,
    filters: {} as FundingFilterState,
    validation: {
      isValidating: false,
      validationData: null,
      selectedSources: [],
      requiredAmount: 0
    } as FundingValidationState
  });

  // 載入資金來源
  const loadFundingSources = useCallback(async (params?: Partial<FundingFilterState>) => {
    try {
      setLocalState(prev => ({ ...prev, loading: true, error: null }));
      
      const queryParams = {
        ...localState.filters,
        ...params,
        // 轉換為 API 參數格式
        organizationId: params?.organizationId || localState.filters.organizationId,
        fundingType: params?.fundingType || localState.filters.fundingType,
        isAvailable: params?.isAvailable !== undefined ? params.isAvailable : localState.filters.isAvailable,
        minAmount: params?.minAmount || localState.filters.minAmount,
        maxAmount: params?.maxAmount || localState.filters.maxAmount,
        startDate: params?.startDate || localState.filters.startDate,
        endDate: params?.endDate || localState.filters.endDate
      };
      
      console.log('💰 載入資金來源，參數:', queryParams);
      
      // 使用 embeddedFundingTrackingService 來獲取可用資金來源
      const response = await embeddedFundingTrackingService.getAvailableFundingSources(queryParams);
      
      if (response.success && response.data) {
        setLocalState(prev => ({
          ...prev,
          fundingSources: response.data.fundingSources || [],
          loading: false
        }));
        console.log('💰 資金來源載入完成:', response.data.fundingSources?.length || 0);
      } else {
        throw new Error('載入資金來源失敗');
      }
    } catch (error) {
      console.error('❌ 載入資金來源失敗:', error);
      setLocalState(prev => ({
        ...prev,
        loading: false,
        error: '載入資金來源失敗',
        notification: {
          open: true,
          message: '載入資金來源失敗',
          severity: 'error'
        }
      }));
    }
  }, [localState.filters]);

  // 載入資金流向
  const loadFundingFlow = useCallback(async (transactionId: string) => {
    try {
      setLocalState(prev => ({ ...prev, flowLoading: true, error: null }));
      
      console.log('🔄 載入資金流向，交易ID:', transactionId);
      
      const response = await embeddedFundingTrackingService.getFundingFlow(transactionId);
      
      if (response.success && response.data) {
        // 直接使用 API 回應資料，因為後端已經回傳正確的 FundingFlowData 結構
        setLocalState(prev => ({
          ...prev,
          fundingFlowData: response.data as FundingFlowData,
          flowLoading: false
        }));
        console.log('🔄 資金流向載入完成');
      } else {
        throw new Error('載入資金流向失敗');
      }
    } catch (error) {
      console.error('❌ 載入資金流向失敗:', error);
      setLocalState(prev => ({
        ...prev,
        flowLoading: false,
        error: '載入資金流向失敗',
        notification: {
          open: true,
          message: '載入資金流向失敗',
          severity: 'error'
        }
      }));
    }
  }, []);

  // 驗證資金來源
  const validateFundingSources = useCallback(async (sourceIds: string[], requiredAmount: number) => {
    try {
      setLocalState(prev => ({
        ...prev,
        validation: {
          ...prev.validation,
          isValidating: true,
          selectedSources: sourceIds,
          requiredAmount
        }
      }));
      
      console.log('✅ 驗證資金來源，來源IDs:', sourceIds, '所需金額:', requiredAmount);
      
      const response = await embeddedFundingTrackingService.validateFundingSources({
        sourceTransactionIds: sourceIds,
        requiredAmount
      });
      
      if (response.success && response.data) {
        setLocalState(prev => ({
          ...prev,
          validation: {
            ...prev.validation,
            isValidating: false,
            validationData: response.data
          }
        }));
        
        const { isSufficient } = response.data;
        setLocalState(prev => ({
          ...prev,
          notification: {
            open: true,
            message: isSufficient ? '資金來源驗證通過' : '資金來源不足',
            severity: isSufficient ? 'success' : 'warning'
          }
        }));
        
        console.log('✅ 資金來源驗證完成，結果:', isSufficient ? '通過' : '不足');
      } else {
        throw new Error('資金來源驗證失敗');
      }
    } catch (error) {
      console.error('❌ 資金來源驗證失敗:', error);
      setLocalState(prev => ({
        ...prev,
        validation: {
          ...prev.validation,
          isValidating: false
        },
        notification: {
          open: true,
          message: '資金來源驗證失敗',
          severity: 'error'
        }
      }));
    }
  }, []);

  // 選擇資金來源
  const selectFundingSource = useCallback((sourceId: string) => {
    setLocalState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        selectedSources: [...prev.validation.selectedSources.filter(id => id !== sourceId), sourceId]
      }
    }));
  }, []);

  // 取消選擇資金來源
  const deselectFundingSource = useCallback((sourceId: string) => {
    setLocalState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        selectedSources: prev.validation.selectedSources.filter(id => id !== sourceId)
      }
    }));
  }, []);

  // 清除所有選擇的資金來源
  const clearSelectedSources = useCallback(() => {
    setLocalState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        selectedSources: [],
        validationData: null
      }
    }));
  }, []);

  // 設定篩選條件
  const setFilters = useCallback((filters: Partial<FundingFilterState>) => {
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

  // 計算總可用金額
  const calculateTotalAvailableAmount = useCallback((): number => {
    return localState.fundingSources.reduce((total, source) => {
      return total + (source.isAvailable ? source.availableAmount : 0);
    }, 0);
  }, [localState.fundingSources]);

  // 計算已選擇的金額
  const calculateSelectedAmount = useCallback((): number => {
    return localState.fundingSources
      .filter(source => localState.validation.selectedSources.includes(source._id))
      .reduce((total, source) => total + source.availableAmount, 0);
  }, [localState.fundingSources, localState.validation.selectedSources]);

  // 可用的資金來源（過濾掉不可用的）
  const availableFundingSources = useMemo(() => {
    return localState.fundingSources.filter(source => source.isAvailable);
  }, [localState.fundingSources]);

  // 篩選後的資金來源
  const filteredFundingSources = useMemo(() => {
    return localState.fundingSources.filter(source => {
      const matchesSearch = !localState.filters.searchTerm || 
        source.description.toLowerCase().includes(localState.filters.searchTerm.toLowerCase()) ||
        source.groupNumber.toLowerCase().includes(localState.filters.searchTerm.toLowerCase());
      
      const matchesFundingType = !localState.filters.fundingType || 
        source.fundingType === localState.filters.fundingType;
      
      const matchesAvailable = localState.filters.isAvailable === undefined || 
        source.isAvailable === localState.filters.isAvailable;
      
      const matchesMinAmount = !localState.filters.minAmount || 
        source.availableAmount >= localState.filters.minAmount;
      
      const matchesMaxAmount = !localState.filters.maxAmount || 
        source.availableAmount <= localState.filters.maxAmount;
      
      const matchesOrganization = !localState.filters.organizationId || 
        source.groupNumber.includes(localState.filters.organizationId); // 簡化的組織匹配邏輯
      
      return matchesSearch && matchesFundingType && matchesAvailable && 
             matchesMinAmount && matchesMaxAmount && matchesOrganization;
    });
  }, [localState.fundingSources, localState.filters]);

  // 初始化載入
  useEffect(() => {
    loadFundingSources();
  }, []); // 只在組件掛載時執行一次

  // 監聽交易錯誤狀態
  useEffect(() => {
    if (transactionError) {
      setLocalState(prev => ({
        ...prev,
        error: transactionError,
        notification: {
          open: true,
          message: transactionError,
          severity: 'error'
        }
      }));
    }
  }, [transactionError]);

  return {
    // 資金來源狀態
    fundingSources: localState.fundingSources,
    availableFundingSources,
    loading: localState.loading || transactionLoading,
    error: localState.error,
    
    // 資金流向狀態
    fundingFlowData: localState.fundingFlowData,
    flowLoading: localState.flowLoading,
    
    // 資金驗證狀態
    validation: localState.validation,
    
    // 本地狀態
    notification: localState.notification,
    filters: localState.filters,
    
    // 載入函數
    loadFundingSources,
    loadFundingFlow,
    
    // 資金驗證函數
    validateFundingSources,
    selectFundingSource,
    deselectFundingSource,
    clearSelectedSources,
    
    // 篩選函數
    setFilters,
    clearFilters,
    
    // 通知函數
    showNotification,
    closeNotification,
    
    // 計算函數
    calculateTotalAvailableAmount,
    calculateSelectedAmount,
    
    // 篩選後的資料
    filteredFundingSources
  };
};

export default useFundingStore;