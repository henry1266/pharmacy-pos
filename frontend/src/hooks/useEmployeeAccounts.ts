import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import employeeAccountService from '../services/employeeAccountService';
import employeeService from '../services/employeeService';
import { EmployeeWithAccount } from '../types/entities';

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
 * 重構自 EmployeeAccountsPage 中的狀態管理和業務邏輯
 */
const useEmployeeAccounts = () => {
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
      setEmployees(employeesWithAccounts);
    } catch (error: any) {
      setError('獲取員工資訊失敗: ' + error.message);
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

  // 驗證表單
  const validateForm = useCallback((isPasswordReset = false, isEdit = false) => {
    const errors: FormErrors = {};

    if (!isEdit) {
      if (!formData.username) {
        errors.username = '請輸入用戶名';
      } else if (formData.username.length < 3) {
        errors.username = '用戶名長度至少需要3個字符';
      }
    }

    if (!isEdit || isPasswordReset) {
      if (!formData.password) {
        errors.password = '請輸入密碼';
      } else if (formData.password.length < 6) {
        errors.password = '密碼長度至少需要6個字符';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = '兩次輸入的密碼不一致';
      }
    }

    if (!isPasswordReset && !isEdit) {
      if (!formData.role) {
        errors.role = '請選擇角色';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

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
    
    if (!validateForm()) return;

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
    if (!validateForm(false, true)) return;

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
    if (!validateForm(true)) return;

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