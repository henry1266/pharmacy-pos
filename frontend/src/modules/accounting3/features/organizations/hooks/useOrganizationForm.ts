/**
 * Organization Form Management Hook
 * 管理組織表單的狀態和驗證
 */

import { useState, useCallback } from 'react';
import { OrganizationFormData } from '../types';

interface UseOrganizationFormOptions {
  initialData?: Partial<OrganizationFormData>;
  onSuccess?: (organization: any) => void;
  onError?: (error: string) => void;
}

interface FormErrors {
  [key: string]: string;
}

export interface UseOrganizationFormReturn {
  formData: OrganizationFormData;
  errors: FormErrors;
  loading: boolean;
  updateField: (field: keyof OrganizationFormData, value: any) => void;
  validateForm: () => boolean;
  submitForm: () => Promise<void>;
  resetForm: () => void;
}

const defaultFormData: OrganizationFormData = {
  name: '',
  code: '',
  type: 'company',
  isActive: true,
  createdBy: '',
  description: ''
};

export const useOrganizationForm = (options: UseOrganizationFormOptions = {}): UseOrganizationFormReturn => {
  const { initialData, onSuccess, onError } = options;
  
  const [formData, setFormData] = useState<OrganizationFormData>({
    ...defaultFormData,
    ...initialData
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const updateField = useCallback((field: keyof OrganizationFormData, value: any) => {
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
      newErrors.name = '組織名稱為必填';
    }

    if (!formData.code.trim()) {
      newErrors.code = '組織代碼為必填';
    } else if (!/^[A-Z0-9]{2,10}$/.test(formData.code)) {
      newErrors.code = '組織代碼格式不正確（2-10位英數字）';
    }

    if (!formData.createdBy) {
      newErrors.createdBy = '建立者為必填';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '電子郵件格式不正確';
    }

    if (formData.phone && !/^[\d\-\+\(\)\s]+$/.test(formData.phone)) {
      newErrors.phone = '電話號碼格式不正確';
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
      // const response = await accounting3Service.organizations.create(formData);
      
      // 暫時模擬成功
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess?.(formData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '建立組織失敗';
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