import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Tooltip,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import employeeAccountService from '../../services/employeeAccountService';
import FormField from './account/FormField';
import AccountDialog from './account/AccountDialog';
import { EmployeeAccount, Role } from '../../types/entities';

// 定義表單資料介面
interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  [key: string]: string;
}

// 定義表單錯誤介面
interface FormErrors {
  [key: string]: string;
}

// 定義角色選項介面
interface RoleOption {
  value: Role;
  label: string;
}

// 定義元件 Props 介面
interface EmployeeAccountManagerProps {
  employeeId: string;
  employeeName: string;
  onAccountChange?: () => void;
}

/**
 * 員工帳號管理元件
 * 用於創建、查看、編輯和刪除員工的系統帳號
 */
const EmployeeAccountManager: React.FC<EmployeeAccountManagerProps> = ({ employeeId, employeeName, onAccountChange }) => {
  const [account, setAccount] = useState<EmployeeAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 角色選項
  const roleOptions: RoleOption[] = [
    { value: 'admin', label: '管理員' },
    { value: 'pharmacist', label: '藥師' },
    { value: 'staff', label: '員工' }
  ];

  // 獲取員工帳號資訊
  const fetchAccountInfo = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const accountData = await employeeAccountService.getEmployeeAccount(employeeId);
      setAccount(accountData);
    } catch (err: any) {
      // 如果錯誤是因為帳號不存在，不顯示錯誤訊息
      if (err.message.includes('尚未建立帳號')) {
        setAccount(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 初始化時獲取帳號資訊
  useEffect(() => {
    if (employeeId) {
      fetchAccountInfo();
    }
  }, [employeeId]);

  // 處理表單輸入變更
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 清除對應欄位的錯誤訊息
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // 驗證表單
  const validateForm = (isPasswordReset = false, isEdit = false): boolean => {
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
  };

  // 開啟創建帳號對話框
  const handleOpenCreateDialog = (): void => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'staff'
    });
    setFormErrors({});
    setCreateDialogOpen(true);
  };

  // 開啟編輯帳號對話框
  const handleOpenEditDialog = (): void => {
    if (!account) return;
    
    setFormData({
      username: account.username,
      email: account.email || '',
      password: '',
      confirmPassword: '',
      role: account.role
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  // 開啟重設密碼對話框
  const handleOpenResetPasswordDialog = (): void => {
    setFormData({
      ...formData,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setResetPasswordDialogOpen(true);
  };

  // 開啟刪除帳號對話框
  const handleOpenDeleteDialog = (): void => {
    setDeleteDialogOpen(true);
  };

  // 關閉所有對話框
  const handleCloseDialogs = (): void => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setResetPasswordDialogOpen(false);
    setDeleteDialogOpen(false);
  };

  // 創建帳號
  const handleCreateAccount = async (): Promise<void> => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await employeeAccountService.createEmployeeAccount({
        employeeId,
        username: formData.username,
        email: formData.email || undefined,
        password: formData.password,
        role: formData.role
      });

      setSuccessMessage('員工帳號創建成功');
      handleCloseDialogs();
      fetchAccountInfo();
      if (onAccountChange) onAccountChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 更新帳號
  const handleUpdateAccount = async (): Promise<void> => {
    if (!validateForm(false, true)) return;
    if (!account) return;

    const updateData: Record<string, any> = {};
    if (formData.username !== account.username) updateData.username = formData.username;
    if (formData.email !== (account.email || '')) updateData.email = formData.email || undefined;
    if (formData.role !== account.role) updateData.role = formData.role;
    if (formData.password) updateData.password = formData.password;

    // 如果沒有任何變更，直接關閉對話框
    if (Object.keys(updateData).length === 0) {
      handleCloseDialogs();
      return;
    }

    setSubmitting(true);
    try {
      await employeeAccountService.updateEmployeeAccount(employeeId, updateData);

      setSuccessMessage('員工帳號更新成功');
      handleCloseDialogs();
      fetchAccountInfo();
      if (onAccountChange) onAccountChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 重設密碼
  const handleResetPassword = async (): Promise<void> => {
    if (!validateForm(true)) return;

    setSubmitting(true);
    try {
      await employeeAccountService.updateEmployeeAccount(employeeId, {
        password: formData.password
      });

      setSuccessMessage('密碼重設成功');
      handleCloseDialogs();
      if (onAccountChange) onAccountChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除帳號
  const handleDeleteAccount = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await employeeAccountService.deleteEmployeeAccount(employeeId);

      setSuccessMessage('員工帳號已刪除');
      handleCloseDialogs();
      setAccount(null);
      if (onAccountChange) onAccountChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 清除成功訊息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 清除錯誤訊息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 獲取角色中文名稱
  const getRoleName = (role: Role): string => {
    switch (role) {
      case 'admin':
        return '管理員';
      case 'pharmacist':
        return '藥師';
      case 'staff':
        return '員工';
      default:
        return role;
    }
  };

  // 獲取角色顏色
  const getRoleColor = (role: Role): "error" | "success" | "primary" | "default" => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'pharmacist':
        return 'success';
      case 'staff':
        return 'primary';
      default:
        return 'default';
    }
  };

  // 渲染提示訊息內容
  const renderAlertContent = () => {
    if (error && !error.includes('尚未建立帳號')) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    } else if (successMessage) {
      return (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      );
    }
    return null;
  };

  // 渲染帳號內容
  const renderAccountContent = () => {
    if (loading) {
      return null;
    }
    
    if (!account) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            {employeeName} 目前沒有系統帳號
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            建立帳號後，員工可以使用電子郵件和密碼登入系統
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Grid container spacing={2} {...({} as any)}>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <Typography variant="subtitle2" color="textSecondary">
              帳號名稱
            </Typography>
            <Typography variant="body1">{account.username}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <Typography variant="subtitle2" color="textSecondary">
              用戶名
            </Typography>
            <Typography variant="body1">{account.username}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <Typography variant="subtitle2" color="textSecondary">
              角色
            </Typography>
            <Chip
              label={getRoleName(account.role)}
              color={getRoleColor(account.role)}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Grid>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <Typography variant="subtitle2" color="textSecondary">
              創建日期
            </Typography>
            <Typography variant="body1">
              {new Date(account.createdAt).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Tooltip title="編輯帳號">
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenEditDialog}
              size="small"
            >
              編輯
            </Button>
          </Tooltip>
          <Tooltip title="重設密碼">
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LockResetIcon />}
              onClick={handleOpenResetPasswordDialog}
              size="small"
            >
              重設密碼
            </Button>
          </Tooltip>
          <Tooltip title="刪除帳號">
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleOpenDeleteDialog}
              size="small"
            >
              刪除
            </Button>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          系統帳號管理
        </Typography>
        {!account && !loading && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            建立帳號
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>載入中...</Typography>
        </Box>
      ) : (
        renderAlertContent()
      )}

      {renderAccountContent()}

      {/* 創建帳號對話框 */}
      <AccountDialog
        open={createDialogOpen}
        onClose={handleCloseDialogs}
        title="建立員工帳號"
        description={`為 ${employeeName} 建立系統登入帳號，帳號建立後員工可以使用電子郵件和密碼登入系統。`}
        onConfirm={handleCreateAccount}
        confirmText="建立"
        submitting={submitting}
      >
        <FormField
          name="username"
          label="用戶名"
          value={formData.username}
          onChange={handleInputChange}
          error={!!formErrors.username}
          helperText={formErrors.username}
          required
        />
        <FormField
          name="email"
          label="電子郵件 (選填)"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={!!formErrors.email}
          helperText={formErrors.email}
        />
        <FormField
          name="password"
          label="密碼"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          error={!!formErrors.password}
          helperText={formErrors.password}
          required
        />
        <FormField
          name="confirmPassword"
          label="確認密碼"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={!!formErrors.confirmPassword}
          helperText={formErrors.confirmPassword}
          required
        />
        <FormField
          type="select"
          name="role"
          label="角色"
          value={formData.role}
          onChange={handleInputChange}
          error={!!formErrors.role}
          helperText={formErrors.role}
          options={roleOptions}
        />
      </AccountDialog>

      {/* 編輯帳號對話框 */}
      <AccountDialog
        open={editDialogOpen}
        onClose={handleCloseDialogs}
        title="編輯員工帳號"
        description={`編輯 ${employeeName} 的系統帳號資訊。如果不需要更改密碼，請留空密碼欄位。`}
        onConfirm={handleUpdateAccount}
        confirmText="更新"
        submitting={submitting}
      >
        <FormField
          name="username"
          label="用戶名"
          value={formData.username}
          onChange={handleInputChange}
          error={!!formErrors.username}
          helperText={formErrors.username}
          required
        />
        <FormField
          name="email"
          label="電子郵件 (選填)"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={!!formErrors.email}
          helperText={formErrors.email}
        />
        <FormField
          name="password"
          label="新密碼 (選填)"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          error={!!formErrors.password}
          helperText={formErrors.password}
        />
        {formData.password && (
          <FormField
            name="confirmPassword"
            label="確認新密碼"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            required
          />
        )}
        <FormField
          type="select"
          name="role"
          label="角色"
          value={formData.role}
          onChange={handleInputChange}
          error={!!formErrors.role}
          helperText={formErrors.role}
          options={roleOptions}
        />
      </AccountDialog>

      {/* 重設密碼對話框 */}
      <AccountDialog
        open={resetPasswordDialogOpen}
        onClose={handleCloseDialogs}
        title="重設密碼"
        description={`為 ${employeeName} 重設系統帳號密碼。`}
        onConfirm={handleResetPassword}
        confirmText="重設密碼"
        confirmColor="warning"
        submitting={submitting}
      >
        <FormField
          name="password"
          label="新密碼"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          error={!!formErrors.password}
          helperText={formErrors.password}
          required
        />
        <FormField
          name="confirmPassword"
          label="確認新密碼"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={!!formErrors.confirmPassword}
          helperText={formErrors.confirmPassword}
          required
        />
      </AccountDialog>

      {/* 刪除帳號對話框 */}
      <AccountDialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        title="刪除員工帳號"
        description={`您確定要刪除 ${employeeName} 的系統帳號嗎？此操作無法復原，刪除後員工將無法登入系統。`}
        onConfirm={handleDeleteAccount}
        confirmText="確認刪除"
        confirmColor="error"
        submitting={submitting}
        maxWidth="xs"
      />
    </Paper>
  );
};

export default EmployeeAccountManager;