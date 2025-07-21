/**
 * Account Form Management Hook
 * 管理科目表單的狀態和驗證
 */

import { useState, useCallback } from 'react';
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

export const useAccountForm = (options: UseAccountFormOptions = {}): UseAccountFormReturn => {
  const { initialData, onSuccess, onError } = options;
  
  const [formData, setFormData] = useState<AccountFormData>({
    ...defaultFormData,
    ...initialData
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const updateField = useCallback((field: keyof AccountFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除該欄位的錯誤
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '科目名稱為必填';
    }

    if (!formData.code.trim()) {
      newErrors.code = '科目代碼為必填';
    } else if (!/^\d{2,8}$/.test(formData.code)) {
      newErrors.code = '科目代碼格式不正確';
    }

    if (!formData.organizationId) {
      newErrors.organizationId = '組織為必填';
    }

    if (!formData.createdBy) {
      newErrors.createdBy = '建立者為必填';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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
    setFormData({ ...defaultFormData, ...initialData });
    setErrors({});
  }, [initialData]);

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