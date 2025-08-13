/**
 * Account Form Management Hook
 * 管理科目表單的狀態和驗證
 */

import { useState, useCallback, useMemo } from 'react';
import { AccountFormData } from '../types';

interface UseAccountFormOptions {
  initialData?: Partial<AccountFormData>;
  onSuccess?: (account: any) => void;
  onError?: (error: string) => void;
}

interface FormErrors {
  [key: string]: string;
}

export interface UseAccountFormReturn {
  formData: AccountFormData;
  errors: FormErrors;
  loading: boolean;
  updateField: (field: keyof AccountFormData, value: any) => void;
  validateForm: () => boolean;
  submitForm: () => Promise<void>;
  resetForm: () => void;
}

const defaultFormData: AccountFormData = {
  name: '',
  code: '',
  type: 'asset',
  isActive: true,
  balance: 0,
  initialBalance: 0,
  currency: 'TWD',
  normalBalance: 'debit',
  organizationId: '',
  createdBy: '',
  description: ''
};

// 驗證規則配置 - 減少重複的驗證邏輯
interface ValidationRule {
  required: boolean;
  message: string;
  validator: (value: string) => boolean;
  formatMessage?: string;
  formatValidator?: (value: string) => boolean;
}

const validationRules: Record<string, ValidationRule> = {
  name: {
    required: true,
    message: '科目名稱為必填',
    validator: (value: string) => value.trim().length > 0
  },
  code: {
    required: true,
    message: '科目代碼為必填',
    formatMessage: '科目代碼格式不正確',
    validator: (value: string) => value.trim().length > 0,
    formatValidator: (value: string) => /^\d{2,8}$/.test(value)
  },
  organizationId: {
    required: true,
    message: '組織為必填',
    validator: (value: string) => Boolean(value)
  },
  createdBy: {
    required: true,
    message: '建立者為必填',
    validator: (value: string) => Boolean(value)
  }
};

export const useAccountForm = (options: UseAccountFormOptions = {}): UseAccountFormReturn => {
  const { initialData, onSuccess, onError } = options;
  
  // 使用 useMemo 避免重複計算初始表單資料
  const initialFormData = useMemo(() => ({
    ...defaultFormData,
    ...initialData
  }), [initialData]);
  
  const [formData, setFormData] = useState<AccountFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // 抽取錯誤清除邏輯
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const updateField = useCallback((field: keyof AccountFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除該欄位的錯誤
    clearFieldError(field as string);
  }, [clearFieldError]);

  // 抽取通用驗證邏輯
  const validateField = useCallback((
    fieldName: string,
    value: any,
    errors: FormErrors
  ) => {
    const rule = validationRules[fieldName];
    if (!rule) return;
    
    if (rule.required && !rule.validator(value)) {
      errors[fieldName] = rule.message;
      return;
    }
    
    // 特殊格式驗證（如 code 欄位）
    if (fieldName === 'code' && value.trim() && rule.formatValidator && !rule.formatValidator(value)) {
      errors[fieldName] = rule.formatMessage!;
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // 使用統一的驗證邏輯
    validateField('name', formData.name, newErrors);
    validateField('code', formData.code, newErrors);
    validateField('organizationId', formData.organizationId, newErrors);
    validateField('createdBy', formData.createdBy, newErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const submitForm = useCallback(async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // TODO: 實作 API 呼叫
      // const response = await accounting3Service.accounts.create(formData);
      
      // 暫時模擬成功
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess?.(formData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '建立科目失敗';
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onSuccess, onError]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, [initialFormData]);

  return {
    formData,
    errors,
    loading,
    updateField,
    validateForm,
    submitForm,
    resetForm
  };
};