import { useState, useEffect, useCallback } from 'react';
import { 
  TransactionGroupWithEntriesFormData,
  EmbeddedAccountingEntryFormData 
} from '@pharmacy-pos/shared';
import { convertBackendDataToFormData, createDefaultEntries } from '../../utils/dataConverters';
import { validateTransactionForm, ValidationResult } from '../../utils/formValidation';

interface UseTransactionFormProps {
  initialData?: Partial<TransactionGroupWithEntriesFormData>;
  mode?: 'create' | 'edit' | 'view';
  defaultAccountId?: string;
  defaultOrganizationId?: string;
  isCopyMode?: boolean;
}

interface UseTransactionFormReturn {
  // 表單資料
  formData: TransactionGroupWithEntriesFormData;
  setFormData: React.Dispatch<React.SetStateAction<TransactionGroupWithEntriesFormData>>;
  
  // 驗證狀態
  validation: ValidationResult;
  validateForm: () => boolean;
  
  // 表單操作
  handleBasicInfoChange: (field: keyof TransactionGroupWithEntriesFormData, value: any) => void;
  handleEntriesChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  resetForm: () => void;
  
  // 狀態
  isFormValid: boolean;
}

export const useTransactionForm = ({
  initialData,
  mode = 'create',
  defaultAccountId,
  defaultOrganizationId,
  isCopyMode = false
}: UseTransactionFormProps): UseTransactionFormReturn => {
  
  // 初始化表單資料
  const initializeFormData = useCallback((): TransactionGroupWithEntriesFormData => {
    console.log('🏗️ 初始化 formData:', {
      hasInitialData: !!initialData,
      isCopyMode,
      defaultAccountId,
      defaultOrganizationId
    });
    
    // 如果有初始資料，使用轉換後的資料初始化
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('🔄 使用 initialData 初始化:', initialData);
      
      try {
        const convertedData = convertBackendDataToFormData(initialData);
        console.log('✅ 初始狀態轉換結果:', convertedData);
        
        // 驗證轉換結果
        if (!convertedData || Object.keys(convertedData).length === 0) {
          console.warn('⚠️ 轉換結果為空，使用預設值');
          return {
            description: '',
            transactionDate: new Date(),
            organizationId: defaultOrganizationId,
            receiptUrl: '',
            invoiceNo: '',
            entries: createDefaultEntries(defaultAccountId)
          };
        }
        
        const entries = convertedData.entries && Array.isArray(convertedData.entries) && convertedData.entries.length >= 2
          ? convertedData.entries
          : createDefaultEntries(defaultAccountId);
        
        const description = isCopyMode ? '' : (convertedData.description || '');
        const transactionDate = convertedData.transactionDate || new Date();
        
        const initialFormData: TransactionGroupWithEntriesFormData = {
          description,
          transactionDate,
          organizationId: convertedData.organizationId,
          receiptUrl: convertedData.receiptUrl || '',
          invoiceNo: convertedData.invoiceNo || '',
          entries,
          // 資金來源追蹤欄位 - 複製模式下清空
          linkedTransactionIds: isCopyMode ? undefined : convertedData.linkedTransactionIds,
          sourceTransactionId: isCopyMode ? undefined : convertedData.sourceTransactionId,
          fundingType: isCopyMode ? 'original' : (convertedData.fundingType || 'original')
        };
        
        console.log('🎯 初始 formData 設定完成:', initialFormData);
        return initialFormData;
        
      } catch (error) {
        console.error('❌ 初始狀態轉換失敗:', error);
        // 回傳安全的預設值
        return {
          description: '',
          transactionDate: new Date(),
          organizationId: defaultOrganizationId,
          receiptUrl: '',
          invoiceNo: '',
          entries: createDefaultEntries(defaultAccountId)
        };
      }
    }
    
    // 預設狀態
    console.log('📝 使用預設狀態初始化');
    return {
      description: '',
      transactionDate: new Date(),
      organizationId: defaultOrganizationId,
      receiptUrl: '',
      invoiceNo: '',
      entries: createDefaultEntries(defaultAccountId)
    };
  }, [initialData, isCopyMode, defaultAccountId, defaultOrganizationId]);

  // 表單狀態
  const [formData, setFormData] = useState<TransactionGroupWithEntriesFormData>(initializeFormData);
  
  // 驗證狀態
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    balanceError: ''
  });

  // 初始化表單資料 - 當 initialData 變化時
  useEffect(() => {
    console.log('🔄 useEffect 觸發 - initialData 變化:', {
      hasInitialData: !!initialData,
      isCopyMode,
      initialDataKeys: initialData ? Object.keys(initialData) : []
    });
    
    if (initialData && Object.keys(initialData).length > 0) {
      const newFormData = initializeFormData();
      setFormData(newFormData);
    }
  }, [initialData, initializeFormData]);

  // 當 defaultOrganizationId 變化時，重新設置預設機構
  useEffect(() => {
    if (defaultOrganizationId && mode === 'create' && !initialData) {
      console.log('🔄 重新設置預設機構:', defaultOrganizationId);
      setFormData(prev => ({
        ...prev,
        organizationId: defaultOrganizationId
      }));
    }
  }, [defaultOrganizationId, mode, initialData]);

  // 驗證表單
  const validateFormData = useCallback((): boolean => {
    const result = validateTransactionForm(formData, mode);
    setValidation(result);
    return result.isValid;
  }, [formData, mode]);

  // 處理基本資訊變更
  const handleBasicInfoChange = useCallback((field: keyof TransactionGroupWithEntriesFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 清除對應的錯誤
    if (validation.errors[field]) {
      setValidation(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: undefined
        }
      }));
    }
  }, [validation.errors]);

  // 處理分錄變更
  const handleEntriesChange = useCallback((entries: EmbeddedAccountingEntryFormData[]) => {
    setFormData(prev => ({
      ...prev,
      entries
    }));

    // 清除分錄錯誤
    if (validation.errors.entries) {
      setValidation(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          entries: undefined
        },
        balanceError: ''
      }));
    }
  }, [validation.errors.entries]);

  // 重置表單
  const resetForm = useCallback(() => {
    const newFormData = initializeFormData();
    setFormData(newFormData);
    setValidation({
      isValid: true,
      errors: {},
      balanceError: ''
    });
  }, [initializeFormData]);

  // 計算表單是否有效
  const isFormValid = validation.isValid && Object.keys(validation.errors).length === 0 && !validation.balanceError;

  return {
    formData,
    setFormData,
    validation,
    validateForm: validateFormData,
    handleBasicInfoChange,
    handleEntriesChange,
    resetForm,
    isFormValid
  };
};