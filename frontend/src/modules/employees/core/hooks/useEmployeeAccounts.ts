/**
 * 員工帳號管理 Hook
 * 重構自原始 useEmployeeAccounts，適配新的模組化架構
 */

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { employeeAccountService } from '../employeeAccountService';
import { employeeService } from '../employeeService';
import { EmployeeWithAccount } from '@pharmacy-pos/shared/types/entities';
import { PasswordValidation, ValidationResult } from '@pharmacy-pos/shared/types/utils';

/**
 * 表單資料介面
 */
interface FormData {
  employeeId: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'pharmacist' | 'staff';
}

/**
 * 表單錯誤介面
 */
interface FormErrors {
  employeeId?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  [key: string]: string | undefined;
}

/**
 * 員工帳號管理 Hook
 * 提供員工帳號的 CRUD 操作和表單管理功能
 */
export const useEmployeeAccounts = () => {
  // 基本狀態
  const [employees, setEmployees] = useState<EmployeeWithAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAccount | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 對話框狀態
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [unbindDialogOpen, setUnbindDialogOpen] = useState<boolean>(false);

  // 表單狀態
  const [formData, setFormData] = useState<FormData>({
    employeeId: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // 獲取員工列表
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const employeesWithAccounts = await employeeService.getEmployeesWithAccountStatus();
      // 確保 employeesWithAccounts 是陣列
      if (Array.isArray(employeesWithAccounts)) {
        setEmployees(employeesWithAccounts);
      } else {
        console.warn('員工資料不是陣列格式:', employeesWithAccounts);
        setEmployees([]);
      }
    } catch (error: any) {
      console.error('獲取員工資訊失敗:', error);
      setError('獲取員工資訊失敗: ' + error.message);
      // 確保在錯誤情況下 employees 仍然是空陣列
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 處理表單輸入變更
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 清除對應欄位的錯誤訊息
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  // 驗證密碼強度
  const validatePasswordStrength = useCallback((password: string): PasswordValidation => {
    const result: PasswordValidation = {
      isValid: true,
      errors: [],
      strength: 'weak',
      score: 0
    };

    if (password.length < 6) {
      result.isValid = false;
      result.errors.push('密碼長度至少需要6個字符');
    } else if (password.length >= 8) {
      result.score += 1;
    }

    if (/[A-Z]/.test(password)) result.score += 1;
    if (/[a-z]/.test(password)) result.score += 1;
    if (/\d/.test(password)) result.score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) result.score += 1;

    // 設定密碼強度
    if (result.score >= 4) {
      result.strength = 'very_strong';
    } else if (result.score >= 3) {
      result.strength = 'strong';
    } else if (result.score >= 2) {
      result.strength = 'medium';
    } else {
      result.strength = 'weak';
    }

    if (result.score < 2 && result.isValid) {
      result.errors.push('建議使用大小寫字母、數字和特殊字符組合');
    }

    return result;
  }, []);

  // 驗證用戶名
  const validateUsername = useCallback((errors: FormErrors, isEdit: boolean): void => {
    if (isEdit) return;
    
    if (!formData.username) {
      errors.username = '請輸入用戶名';
    } else if (formData.username.length < 3) {
      errors.username = '用戶名長度至少需要3個字符';
    }
  }, [formData.username]);

  // 驗證密碼
  const validatePassword = useCallback((errors: FormErrors, isEdit: boolean, isPasswordReset: boolean): void => {
    if (!isEdit || isPasswordReset) {
      if (!formData.password) {
        errors.password = '請輸入密碼';
      } else {
        const passwordValidation = validatePasswordStrength(formData.password);
        if (!passwordValidation.isValid) {
          errors.password = passwordValidation.errors.join(', ');
        }
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = '兩次輸入的密碼不一致';
      }
    }
  }, [formData.password, formData.confirmPassword, validatePasswordStrength]);

  // 驗證角色
  const validateRole = useCallback((errors: FormErrors, isPasswordReset: boolean, isEdit: boolean): void => {
    if (!isPasswordReset && !isEdit && !formData.role) {
      errors.role = '請選擇角色';
    }
  }, [formData.role]);

  // 驗證表單
  const validateForm = useCallback((isPasswordReset = false, isEdit = false): ValidationResult => {
    const errors: FormErrors = {};

    validateUsername(errors, isEdit);
    validatePassword(errors, isEdit, isPasswordReset);
    validateRole(errors, isPasswordReset, isEdit);

    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    
    return {
      isValid,
      errors: Object.keys(errors).length > 0 ? Object.entries(errors).map(([field, message]) => ({
        field,
        message: message ?? '',
        value: formData[field as keyof FormData]
      })) : [],
      warnings: []
    };
  }, [validateUsername, validatePassword, validateRole]);

  // 對話框操作
  const handleOpenEditDialog = useCallback((employee: EmployeeWithAccount, account: any) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee._id,
      username: account.username,
      email: account.email ?? '',
      password: '',
      confirmPassword: '',
      role: account.role
    });
    setFormErrors({});
    setEditDialogOpen(true);
  }, []);

  const handleOpenResetPasswordDialog = useCallback((employee: EmployeeWithAccount) => {
    setSelectedEmployee(employee);
    setFormData({
      ...formData,
      employeeId: employee._id,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setResetPasswordDialogOpen(true);
  }, [formData]);

  const handleOpenDeleteDialog = useCallback((employee: EmployeeWithAccount) => {
    setSelectedEmployee(employee);
    setFormData({
      ...formData,
      employeeId: employee._id
    });
    setDeleteDialogOpen(true);
  }, [formData]);

  const handleOpenUnbindDialog = useCallback((employee: EmployeeWithAccount) => {
    setSelectedEmployee(employee);
    setFormData({
      ...formData,
      employeeId: employee._id
    });
    setUnbindDialogOpen(true);
  }, [formData]);

  const handleCloseDialogs = useCallback(() => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setResetPasswordDialogOpen(false);
    setDeleteDialogOpen(false);
    setUnbindDialogOpen(false);
    setSelectedEmployee(null);
  }, []);

  // CRUD 操作
  const handleCreateAccount = useCallback(async () => {
    if (!formData.employeeId) {
      setFormErrors(prev => ({
        ...prev,
        employeeId: '請選擇員工'
      }));
      return;
    }
    
    const validation = validateForm();
    if (!validation.isValid) return;

    setSubmitting(true);
    try {
      const employee = employees.find(emp => emp._id === formData.employeeId);
      if (employee?.account) {
        setError('此員工已有帳號，請選擇其他員工');
        setSubmitting(false);
        return;
      }

      await employeeAccountService.createEmployeeAccount({
        employeeId: formData.employeeId,
        username: formData.username,
        email: formData.email ?? undefined,
        password: formData.password,
        role: formData.role
      });

      setSuccessMessage('員工帳號創建成功');
      handleCloseDialogs();
      await fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, employees, validateForm, handleCloseDialogs, fetchEmployees]);

  const handleUpdateAccount = useCallback(async () => {
    const validation = validateForm(false, true);
    if (!validation.isValid) return;

    const updateData: Record<string, any> = {};
    if (formData.username) updateData.username = formData.username;
    if (formData.email !== undefined) updateData.email = formData.email ?? undefined;
    if (formData.role) updateData.role = formData.role;
    if (formData.password) updateData.password = formData.password;

    if (Object.keys(updateData).length === 0) {
      handleCloseDialogs();
      return;
    }

    setSubmitting(true);
    try {
      await employeeAccountService.updateEmployeeAccount(formData.employeeId, updateData);
      setSuccessMessage('員工帳號更新成功');
      handleCloseDialogs();
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, handleCloseDialogs, fetchEmployees]);

  const handleResetPassword = useCallback(async () => {
    const validation = validateForm(true);
    if (!validation.isValid) return;

    setSubmitting(true);
    try {
      await employeeAccountService.updateEmployeeAccount(formData.employeeId, {
        password: formData.password
      });
      setSuccessMessage('密碼重設成功');
      handleCloseDialogs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, handleCloseDialogs]);

  const handleDeleteAccount = useCallback(async () => {
    setSubmitting(true);
    try {
      await employeeAccountService.deleteEmployeeAccount(formData.employeeId);
      setSuccessMessage('員工帳號已刪除');
      handleCloseDialogs();
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, handleCloseDialogs, fetchEmployees]);

  const handleUnbindAccount = useCallback(async () => {
    setSubmitting(true);
    try {
      await employeeAccountService.unbindEmployeeAccount(formData.employeeId);
      setSuccessMessage('員工帳號綁定已解除');
      handleCloseDialogs();
      await fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, handleCloseDialogs, fetchEmployees]);

  // 清除訊息的 useEffect
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // 狀態
    employees,
    isLoading,
    error,
    successMessage,
    selectedEmployee,
    submitting,
    
    // 對話框狀態
    createDialogOpen,
    editDialogOpen,
    resetPasswordDialogOpen,
    deleteDialogOpen,
    unbindDialogOpen,
    
    // 表單狀態
    formData,
    formErrors,
    
    // 操作函數
    setCreateDialogOpen,
    setSelectedEmployee,
    setFormData,
    handleInputChange,
    handleOpenEditDialog,
    handleOpenResetPasswordDialog,
    handleOpenDeleteDialog,
    handleOpenUnbindDialog,
    handleCloseDialogs,
    handleCreateAccount,
    handleUpdateAccount,
    handleResetPassword,
    handleDeleteAccount,
    handleUnbindAccount
  };
};

export default useEmployeeAccounts;