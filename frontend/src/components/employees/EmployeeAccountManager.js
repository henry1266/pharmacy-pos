import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import employeeAccountService from '../../services/employeeAccountService';

/**
 * 員工帳號管理元件
 * 用於創建、查看、編輯和刪除員工的系統帳號
 */
const EmployeeAccountManager = ({ employeeId, employeeName, onAccountChange }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 獲取員工帳號資訊
  const fetchAccountInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const accountData = await employeeAccountService.getEmployeeAccount(employeeId);
      setAccount(accountData);
    } catch (err) {
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
  const handleInputChange = (e) => {
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
  const validateForm = (isPasswordReset = false, isEdit = false) => {
    const errors = {};

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
  const handleOpenCreateDialog = () => {
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
  const handleOpenEditDialog = () => {
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
  const handleOpenResetPasswordDialog = () => {
    setFormData({
      ...formData,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setResetPasswordDialogOpen(true);
  };

  // 開啟刪除帳號對話框
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  // 關閉所有對話框
  const handleCloseDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setResetPasswordDialogOpen(false);
    setDeleteDialogOpen(false);
  };

  // 創建帳號
  const handleCreateAccount = async () => {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 更新帳號
  const handleUpdateAccount = async () => {
    if (!validateForm(false, true)) return;

    const updateData = {};
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
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 重設密碼
  const handleResetPassword = async () => {
    if (!validateForm(true)) return;

    setSubmitting(true);
    try {
      await employeeAccountService.updateEmployeeAccount(employeeId, {
        password: formData.password
      });

      setSuccessMessage('密碼重設成功');
      handleCloseDialogs();
      if (onAccountChange) onAccountChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除帳號
  const handleDeleteAccount = async () => {
    setSubmitting(true);
    try {
      await employeeAccountService.deleteEmployeeAccount(employeeId);

      setSuccessMessage('員工帳號已刪除');
      handleCloseDialogs();
      setAccount(null);
      if (onAccountChange) onAccountChange();
    } catch (err) {
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
  const getRoleName = (role) => {
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
  const getRoleColor = (role) => {
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
      ) : error && !error.includes('尚未建立帳號') ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : successMessage ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      ) : null}

      {!loading && !account ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            {employeeName} 目前沒有系統帳號
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            建立帳號後，員工可以使用電子郵件和密碼登入系統
          </Typography>
        </Box>
      ) : !loading && account ? (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                帳號名稱
              </Typography>
              <Typography variant="body1">{account.name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                用戶名
              </Typography>
              <Typography variant="body1">{account.username}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                創建日期
              </Typography>
              <Typography variant="body1">
                {new Date(account.date).toLocaleDateString()}
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
      ) : null}

      {/* 創建帳號對話框 */}
      <Dialog open={createDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>建立員工帳號</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            為 {employeeName} 建立系統登入帳號，帳號建立後員工可以使用電子郵件和密碼登入系統。
          </DialogContentText>
          <TextField
            margin="dense"
            label="用戶名"
            type="text"
            fullWidth
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            error={!!formErrors.username}
            helperText={formErrors.username}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="電子郵件 (選填)"
            type="email"
            fullWidth
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="密碼"
            type="password"
            fullWidth
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="確認密碼"
            type="password"
            fullWidth
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            required
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="role-label">角色</InputLabel>
            <Select
              labelId="role-label"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              label="角色"
              error={!!formErrors.role}
            >
              <MenuItem value="admin">管理員</MenuItem>
              <MenuItem value="pharmacist">藥師</MenuItem>
              <MenuItem value="staff">員工</MenuItem>
            </Select>
            {formErrors.role && (
              <Typography color="error" variant="caption">
                {formErrors.role}
              </Typography>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleCreateAccount}
            disabled={submitting}
            variant="contained"
            color="primary"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? '處理中...' : '建立'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯帳號對話框 */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>編輯員工帳號</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            編輯 {employeeName} 的系統帳號資訊。如果不需要更改密碼，請留空密碼欄位。
          </DialogContentText>
          <TextField
            margin="dense"
            label="用戶名"
            type="text"
            fullWidth
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            error={!!formErrors.username}
            helperText={formErrors.username}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="電子郵件 (選填)"
            type="email"
            fullWidth
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="新密碼 (選填)"
            type="password"
            fullWidth
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            sx={{ mb: 2 }}
          />
          {formData.password && (
            <TextField
              margin="dense"
              label="確認新密碼"
              type="password"
              fullWidth
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              required={!!formData.password}
              sx={{ mb: 2 }}
            />
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel id="role-label">角色</InputLabel>
            <Select
              labelId="role-label"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              label="角色"
              error={!!formErrors.role}
            >
              <MenuItem value="admin">管理員</MenuItem>
              <MenuItem value="pharmacist">藥師</MenuItem>
              <MenuItem value="staff">員工</MenuItem>
            </Select>
            {formErrors.role && (
              <Typography color="error" variant="caption">
                {formErrors.role}
              </Typography>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleUpdateAccount}
            disabled={submitting}
            variant="contained"
            color="primary"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? '處理中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重設密碼對話框 */}
      <Dialog open={resetPasswordDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>重設密碼</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            為 {employeeName} 重設系統帳號密碼。
          </DialogContentText>
          <TextField
            margin="dense"
            label="新密碼"
            type="password"
            fullWidth
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="確認新密碼"
            type="password"
            fullWidth
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            required
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleResetPassword}
            disabled={submitting}
            variant="contained"
            color="warning"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? '處理中...' : '重設密碼'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 刪除帳號對話框 */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>刪除員工帳號</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除 {employeeName} 的系統帳號嗎？此操作無法復原，刪除後員工將無法登入系統。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={submitting}
            variant="contained"
            color="error"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? '處理中...' : '確認刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EmployeeAccountManager;