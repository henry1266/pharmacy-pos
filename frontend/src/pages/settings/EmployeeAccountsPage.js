import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import employeeAccountService from '../../services/employeeAccountService';
import employeeService from '../../services/employeeService';

/**
 * 員工帳號管理頁面
 * 允許管理員查看、創建、編輯和刪除員工帳號
 */
const EmployeeAccountsPage = () => {
  const [employees, setEmployees] = useState([]); // Initialize as empty array
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unbindDialogOpen, setUnbindDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // 獲取所有員工資訊
  useEffect(() => {
    fetchEmployees();
  }, []);

  // 獲取所有員工資訊
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // 從API獲取所有員工及其帳號狀態
      const employeesWithAccounts = await employeeService.getEmployeesWithAccountStatus();
      setEmployees(employeesWithAccounts);
    } catch (error) {
      setError('獲取員工資訊失敗: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
  const handleOpenCreateDialog = (employee = null) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee ? employee._id : '',
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
  const handleOpenEditDialog = (employee, account) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee._id,
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
  const handleOpenResetPasswordDialog = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee._id,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setResetPasswordDialogOpen(true);
  };

  // 開啟刪除帳號對話框
  const handleOpenDeleteDialog = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee._id
    });
    setDeleteDialogOpen(true);
  };

  // 開啟解除綁定對話框
  const handleOpenUnbindDialog = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee._id
    });
    setUnbindDialogOpen(true);
  };

  // 關閉所有對話框
  const handleCloseDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setResetPasswordDialogOpen(false);
    setDeleteDialogOpen(false);
    setUnbindDialogOpen(false);
  };

  // 創建帳號
  const handleCreateAccount = async () => {
    // 檢查是否選擇了員工
    if (!formData.employeeId) {
      setFormErrors({
        ...formErrors,
        employeeId: '請選擇員工'
      });
      return;
    }
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // 確保選擇的員工沒有帳號
      const employee = employees.find(emp => emp._id === formData.employeeId);
      if (employee && employee.account) {
        setError('此員工已有帳號，請選擇其他員工');
        setSubmitting(false);
        return;
      }

      // 創建帳號
      await employeeAccountService.createEmployeeAccount({
        employeeId: formData.employeeId,
        username: formData.username,
        email: formData.email || undefined,
        password: formData.password,
        role: formData.role
      });

      setSuccessMessage('員工帳號創建成功');
      handleCloseDialogs();
      
      // 重新獲取員工資料以更新列表
      await fetchEmployees();
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
    if (formData.username) updateData.username = formData.username;
    if (formData.email !== undefined) updateData.email = formData.email || undefined;
    if (formData.role) updateData.role = formData.role;
    if (formData.password) updateData.password = formData.password;

    // 如果沒有任何變更，直接關閉對話框
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
      await employeeAccountService.updateEmployeeAccount(formData.employeeId, {
        password: formData.password
      });

      setSuccessMessage('密碼重設成功');
      handleCloseDialogs();
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
      await employeeAccountService.deleteEmployeeAccount(formData.employeeId);

      setSuccessMessage('員工帳號已刪除');
      handleCloseDialogs();
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 解除帳號綁定
  const handleUnbindAccount = async () => {
    setSubmitting(true);
    try {
      await employeeAccountService.unbindEmployeeAccount(formData.employeeId);

      setSuccessMessage('員工帳號綁定已解除');
      handleCloseDialogs();
      
      // 重新獲取員工資料以更新列表
      await fetchEmployees();
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom>員工帳號管理</Typography>
          <Typography variant="body1" color="text.secondary">
            在此頁面您可以管理所有員工的系統帳號
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          新增帳號
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>載入中...</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>員工姓名</TableCell>
                    <TableCell>用戶名</TableCell>
                    <TableCell>電子郵件</TableCell>
                    <TableCell>角色</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.account?.username || '未設置'}</TableCell>
                      <TableCell>{employee.account?.email || '未設置'}</TableCell>
                      <TableCell>
                        {employee.account ? (
                          <Chip 
                            label={getRoleName(employee.account.role)} 
                            color={getRoleColor(employee.account.role)} 
                            size="small" 
                          />
                        ) : (
                          '未設置'
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.account ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="編輯帳號">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDialog(employee, employee.account)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="重設密碼">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleOpenResetPasswordDialog(employee)}
                              >
                                <LockResetIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="解除綁定">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenUnbindDialog(employee)}
                              >
                                <LinkOffIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="刪除帳號">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenDeleteDialog(employee)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            無帳號
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* 創建帳號對話框 */}
      <Dialog open={createDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>建立員工帳號</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            為員工建立系統登入帳號
          </Typography>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="employee-select-label">選擇員工</InputLabel>
            <Select
              labelId="employee-select-label"
              value={selectedEmployee ? selectedEmployee._id : ''}
              onChange={(e) => {
                const selected = employees.find(emp => emp._id === e.target.value);
                if (selected) {
                  setSelectedEmployee(selected);
                  setFormData({
                    ...formData,
                    employeeId: selected._id
                  });
                }
              }}
              label="選擇員工"
            >
              {employees
                .filter(emp => !emp.account) // 只顯示沒有帳號的員工
                .map(emp => (
                  <MenuItem key={emp._id} value={emp._id}>{emp.name}</MenuItem>
                ))
              }
            </Select>
          </FormControl>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            編輯 {selectedEmployee?.name} 的系統帳號資訊
          </Typography>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            為 {selectedEmployee?.name} 重設系統帳號密碼
          </Typography>
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
          <Typography variant="body2">
            您確定要刪除 {selectedEmployee?.name} 的系統帳號嗎？此操作無法復原，刪除後員工將無法登入系統。
          </Typography>
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

      {/* 解除綁定對話框 */}
      <Dialog open={unbindDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>解除帳號綁定</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            您確定要解除 {selectedEmployee?.name} 與其帳號的綁定嗎？此操作不會刪除帳號，但會使帳號與員工資料分離。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleUnbindAccount}
            disabled={submitting}
            variant="contained"
            color="info"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? '處理中...' : '確認解除綁定'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeAccountsPage;