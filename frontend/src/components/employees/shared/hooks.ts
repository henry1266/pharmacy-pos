/**
 * 員工模組共用 Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { EmployeeAccount, Employee } from '../../../types/entities';
import { OvertimeRecord } from '../../../services/overtimeRecordService';
import { FormData, FormErrors } from './types';
import {
  validateAccountForm,
  validateOvertimeForm,
  clearFieldError,
  getChangedFields,
  handleApiError
} from './utils';
import {
  DEFAULT_FORM_VALUES,
  DIALOG_CONFIG
} from './constants';

/**
 * 帳號管理 Hook
 */
export const useAccountManagement = (employeeId: string) => {
  const [account, setAccount] = useState<EmployeeAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 獲取帳號資訊
  const fetchAccountInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 這裡應該調用實際的 API
      // const accountData = await employeeAccountService.getEmployeeAccount(employeeId);
      // setAccount(accountData);
    } catch (err: any) {
      if (err.message.includes('尚未建立帳號')) {
        setAccount(null);
      } else {
        setError(handleApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  // 清除訊息
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage('');
  }, []);

  // 設置成功訊息
  const setSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), DIALOG_CONFIG.autoHideDuration);
  }, []);

  // 設置錯誤訊息
  const setErrorMessage = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), DIALOG_CONFIG.autoHideDuration);
  }, []);

  return {
    account,
    loading,
    error,
    successMessage,
    fetchAccountInfo,
    clearMessages,
    setSuccess,
    setErrorMessage,
    setAccount
  };
};

/**
 * 表單管理 Hook
 */
export const useFormManagement = <T extends FormData>(
  initialData: T,
  validator: (data: T) => { isValid: boolean; errors: FormErrors }
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 處理輸入變更
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除對應欄位的錯誤
    if (formErrors[name]) {
      setFormErrors(prev => clearFieldError(prev, name));
    }
  }, [formErrors]);

  // 驗證表單
  const validateForm = useCallback(() => {
    const { isValid, errors } = validator(formData);
    setFormErrors(errors);
    return isValid;
  }, [formData, validator]);

  // 重置表單
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setFormErrors({});
    setSubmitting(false);
  }, [initialData]);

  // 設置表單資料
  const setFormDataValues = useCallback((data: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  return {
    formData,
    formErrors,
    submitting,
    handleInputChange,
    validateForm,
    resetForm,
    setFormDataValues,
    setSubmitting,
    setFormErrors
  };
};

/**
 * 對話框管理 Hook
 */
export const useDialogManagement = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState<boolean>(false);

  // 開啟創建對話框
  const openCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  // 開啟編輯對話框
  const openEditDialog = useCallback(() => {
    setEditDialogOpen(true);
  }, []);

  // 開啟刪除對話框
  const openDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  // 開啟重設密碼對話框
  const openResetPasswordDialog = useCallback(() => {
    setResetPasswordDialogOpen(true);
  }, []);

  // 關閉所有對話框
  const closeAllDialogs = useCallback(() => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setResetPasswordDialogOpen(false);
  }, []);

  return {
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    resetPasswordDialogOpen,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openResetPasswordDialog,
    closeAllDialogs
  };
};

/**
 * 加班記錄管理 Hook
 */
export const useOvertimeManagement = (employeeId?: string | null) => {
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);

  // 獲取加班記錄
  const fetchOvertimeRecords = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    try {
      // 這裡應該調用實際的 API
      // const records = await overtimeRecordService.getOvertimeRecords(params);
      // setOvertimeRecords(records);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // 獲取員工列表
  const fetchEmployees = useCallback(async () => {
    try {
      // 這裡應該調用實際的 API
      // const response = await employeeService.getEmployees({ limit: 1000 });
      // setEmployees(response.employees);
    } catch (err: any) {
      setError(handleApiError(err));
    }
  }, []);

  // 創建加班記錄
  const createOvertimeRecord = useCallback(async (data: any) => {
    try {
      // 這裡應該調用實際的 API
      // await overtimeRecordService.createOvertimeRecord(data);
      return true;
    } catch (err: any) {
      setError(handleApiError(err));
      return false;
    }
  }, []);

  // 更新加班記錄
  const updateOvertimeRecord = useCallback(async (id: string, data: any) => {
    try {
      // 這裡應該調用實際的 API
      // await overtimeRecordService.updateOvertimeRecord(id, data);
      return true;
    } catch (err: any) {
      setError(handleApiError(err));
      return false;
    }
  }, []);

  // 刪除加班記錄
  const deleteOvertimeRecord = useCallback(async (id: string) => {
    try {
      // 這裡應該調用實際的 API
      // await overtimeRecordService.deleteOvertimeRecord(id);
      return true;
    } catch (err: any) {
      setError(handleApiError(err));
      return false;
    }
  }, []);

  // 清除訊息
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage('');
  }, []);

  return {
    overtimeRecords,
    employees,
    loading,
    error,
    successMessage,
    selectedRecord,
    fetchOvertimeRecords,
    fetchEmployees,
    createOvertimeRecord,
    updateOvertimeRecord,
    deleteOvertimeRecord,
    clearMessages,
    setSelectedRecord,
    setSuccessMessage,
    setError
  };
};

/**
 * 月份篩選 Hook
 */
export const useMonthFilter = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());

  // 處理年份變更
  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
  }, []);

  // 處理月份變更
  const handleMonthChange = useCallback((month: number) => {
    setSelectedMonth(month);
  }, []);

  // 獲取日期範圍
  const getDateRange = useCallback(() => {
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    return { startDate, endDate };
  }, [selectedYear, selectedMonth]);

  return {
    selectedYear,
    selectedMonth,
    handleYearChange,
    handleMonthChange,
    getDateRange
  };
};

/**
 * 展開狀態管理 Hook
 */
export const useExpandedState = <T extends string>() => {
  const [expandedItems, setExpandedItems] = useState<Record<T, boolean>>({} as Record<T, boolean>);

  // 切換展開狀態
  const toggleExpanded = useCallback((id: T) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // 設置展開狀態
  const setExpanded = useCallback((id: T, expanded: boolean) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: expanded
    }));
  }, []);

  // 重置所有展開狀態
  const resetExpanded = useCallback(() => {
    setExpandedItems({} as Record<T, boolean>);
  }, []);

  return {
    expandedItems,
    toggleExpanded,
    setExpanded,
    resetExpanded
  };
};