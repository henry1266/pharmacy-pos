import { useState, useEffect, useCallback } from 'react';
import { 
  TransactionGroupWithEntriesFormData,
  EmbeddedAccountingEntryFormData 
} from '@pharmacy-pos/shared';

interface UseTransactionForm3Props {
  initialData?: Partial<TransactionGroupWithEntriesFormData>;
  mode?: 'create' | 'edit' | 'view';
  defaultAccountId?: string;
  defaultOrganizationId?: string;
  isCopyMode?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  balanceError: string;
}

interface UseTransactionForm3Return {
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

// 建立預設分錄
const createDefaultEntries = (defaultAccountId?: string): EmbeddedAccountingEntryFormData[] => {
  return [
    {
      sequence: 1,
      accountId: defaultAccountId || '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    },
    {
      sequence: 2,
      accountId: '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    }
  ];
};

// 轉換後端資料為表單資料
const convertBackendDataToFormData = (data: any): TransactionGroupWithEntriesFormData => {
  console.log('🔄 [Accounting3] 轉換後端資料:', data);
  
  const convertedData: TransactionGroupWithEntriesFormData = {
    description: data.description || '',
    transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
    organizationId: data.organizationId || '',
    receiptUrl: data.receiptUrl || '',
    invoiceNo: data.invoiceNo || '',
    entries: Array.isArray(data.entries) ? data.entries.map((entry: any, index: number) => ({
      _id: entry._id,
      sequence: entry.sequence || index + 1,
      accountId: typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id || '',
      debitAmount: entry.debitAmount || 0,
      creditAmount: entry.creditAmount || 0,
      description: entry.description || '',
      sourceTransactionId: entry.sourceTransactionId,
      fundingPath: entry.fundingPath
    })) : createDefaultEntries(),
    linkedTransactionIds: data.linkedTransactionIds,
    sourceTransactionId: data.sourceTransactionId,
    fundingType: data.fundingType || 'original'
  };
  
  console.log('✅ [Accounting3] 轉換結果:', convertedData);
  return convertedData;
};

// 驗證表單
const validateTransactionForm = (formData: TransactionGroupWithEntriesFormData, mode: string): ValidationResult => {
  const errors: Record<string, string> = {};
  let balanceError = '';

  // 基本資訊驗證
  if (!formData.description?.trim()) {
    errors.description = '請輸入交易描述';
  }

  if (!formData.transactionDate) {
    errors.transactionDate = '請選擇交易日期';
  }

  // 分錄驗證
  if (!formData.entries || formData.entries.length < 2) {
    errors.entries = '至少需要兩筆分錄';
  } else {
    // 檢查每筆分錄
    const hasInvalidEntry = formData.entries.some(entry => 
      !entry.accountId || 
      (entry.debitAmount === 0 && entry.creditAmount === 0) ||
      (entry.debitAmount > 0 && entry.creditAmount > 0)
    );

    if (hasInvalidEntry) {
      errors.entries = '每筆分錄必須選擇科目且只能填入借方或貸方金額';
    }

    // 檢查借貸平衡
    const totalDebit = formData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = formData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
      balanceError = `借貸不平衡：借方 ${totalDebit.toFixed(2)}，貸方 ${totalCredit.toFixed(2)}`;
    }
  }

  const isValid = Object.keys(errors).length === 0 && !balanceError;

  return {
    isValid,
    errors,
    balanceError
  };
};

export const useTransactionForm3 = ({
  initialData,
  mode = 'create',
  defaultAccountId,
  defaultOrganizationId,
  isCopyMode = false
}: UseTransactionForm3Props): UseTransactionForm3Return => {
  
  // 初始化表單資料
  const initializeFormData = useCallback((): TransactionGroupWithEntriesFormData => {
    console.log('🏗️ [Accounting3] 初始化 formData:', {
      hasInitialData: !!initialData,
      isCopyMode,
      defaultAccountId,
      defaultOrganizationId
    });
    
    // 如果有初始資料，使用轉換後的資料初始化
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('🔄 [Accounting3] 使用 initialData 初始化:', initialData);
      
      try {
        const convertedData = convertBackendDataToFormData(initialData);
        console.log('✅ [Accounting3] 初始狀態轉換結果:', convertedData);
        
        // 驗證轉換結果
        if (!convertedData || Object.keys(convertedData).length === 0) {
          console.warn('⚠️ [Accounting3] 轉換結果為空，使用預設值');
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
        
        console.log('🎯 [Accounting3] 初始 formData 設定完成:', initialFormData);
        return initialFormData;
        
      } catch (error) {
        console.error('❌ [Accounting3] 初始狀態轉換失敗:', error);
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
    console.log('📝 [Accounting3] 使用預設狀態初始化');
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
    console.log('🔄 [Accounting3] useEffect 觸發 - initialData 變化:', {
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
      console.log('🔄 [Accounting3] 重新設置預設機構:', defaultOrganizationId);
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
      setValidation(prev => {
        const newErrors = { ...prev.errors };
        delete newErrors[field];
        return {
          ...prev,
          errors: newErrors
        };
      });
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
      setValidation(prev => {
        const newErrors = { ...prev.errors };
        delete newErrors.entries;
        return {
          ...prev,
          errors: newErrors,
          balanceError: ''
        };
      });
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