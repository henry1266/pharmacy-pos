/**
 * 員工服務 V2 使用範例
 * 展示如何使用員工服務 V2 進行完整的員工管理操作
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AccountBox as AccountIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import employeeServiceV2, {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  searchEmployees,
  getEmployeeAccount,
  createEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  getEmployeesWithAccountStatus,
  validateEmployeeCredentials,
  resetEmployeePassword,
  toggleEmployeeAccountStatus
} from '../services/employeeServiceV2';

import type {
  Employee,
  EmployeeAccount,
  EmployeeWithAccount
} from '@pharmacy-pos/shared/types/entities';
import type {
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  EmployeeAccountCreateRequest,
  EmployeeAccountUpdateRequest,
  EmployeeStats,
  EmployeeListResponse
} from '@pharmacy-pos/shared/services/employeeApiClient';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EmployeeServiceV2Example: React.FC = () => {
  // 狀態管理
  const [employees, setEmployees] = useState<EmployeeWithAccount[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // 對話框狀態
  const [employeeDialog, setEmployeeDialog] = useState(false);
  const [accountDialog, setAccountDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 表單狀態
  const [employeeForm, setEmployeeForm] = useState<EmployeeCreateRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    position: '',
    hireDate: new Date().toISOString().split('T')[0],
    department: '',
    salary: 0
  });

  const [accountForm, setAccountForm] = useState<EmployeeAccountCreateRequest>({
    employeeId: '',
    username: '',
    email: '',
    password: '',
    role: 'staff'
  });

  // 搜尋狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);

  // 載入員工列表
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployeesWithAccountStatus();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || '載入員工列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入統計資料
  const loadStats = async () => {
    try {
      const stats = await getEmployeeStats();
      setEmployeeStats(stats);
    } catch (err: any) {
      setError(err.message || '載入統計資料失敗');
    }
  };

  // 初始載入
  useEffect(() => {
    loadEmployees();
    loadStats();
  }, []);

  // 處理員工創建/更新
  const handleEmployeeSubmit = async () => {
    try {
      setLoading(true);

      // 驗證資料
      const errors = employeeServiceV2.validateEmployeeData(employeeForm);
      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }

      if (isEditing && selectedEmployee) {
        await updateEmployee(selectedEmployee._id, employeeForm);
        setSuccess('員工資訊更新成功');
      } else {
        await createEmployee(employeeForm);
        setSuccess('員工創建成功');
      }

      setEmployeeDialog(false);
      resetEmployeeForm();
      await loadEmployees();
      await loadStats();
    } catch (err: any) {
      setError(err.message || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理員工刪除
  const handleEmployeeDelete = async (employee: EmployeeWithAccount) => {
    if (!window.confirm(`確定要刪除員工 ${employee.name} 嗎？`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteEmployee(employee._id);
      setSuccess('員工刪除成功');
      await loadEmployees();
      await loadStats();
    } catch (err: any) {
      setError(err.message || '刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理帳號創建/更新
  const handleAccountSubmit = async () => {
    try {
      setLoading(true);

      // 驗證資料
      const errors = employeeServiceV2.validateEmployeeAccountData(accountForm);
      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }

      if (selectedEmployee?.account) {
        await updateEmployeeAccount(selectedEmployee._id, accountForm);
        setSuccess('帳號更新成功');
      } else {
        await createEmployeeAccount({ ...accountForm, employeeId: selectedEmployee!._id });
        setSuccess('帳號創建成功');
      }

      setAccountDialog(false);
      resetAccountForm();
      await loadEmployees();
    } catch (err: any) {
      setError(err.message || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理帳號刪除
  const handleAccountDelete = async (employee: EmployeeWithAccount) => {
    if (!window.confirm(`確定要刪除 ${employee.name} 的帳號嗎？`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteEmployeeAccount(employee._id);
      setSuccess('帳號刪除成功');
      await loadEmployees();
    } catch (err: any) {
      setError(err.message || '刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理帳號狀態切換
  const handleAccountToggle = async (employee: EmployeeWithAccount) => {
    if (!employee.account) return;

    try {
      setLoading(true);
      await toggleEmployeeAccountStatus(employee._id, !employee.account.isActive);
      setSuccess(`帳號已${employee.account.isActive ? '停用' : '啟用'}`);
      await loadEmployees();
    } catch (err: any) {
      setError(err.message || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理密碼重設
  const handlePasswordReset = async (employee: EmployeeWithAccount) => {
    const newPassword = window.prompt('請輸入新密碼（至少6個字元）：');
    if (!newPassword || newPassword.length < 6) {
      setError('密碼至少需要6個字元');
      return;
    }

    try {
      setLoading(true);
      await resetEmployeePassword(employee._id, newPassword);
      setSuccess('密碼重設成功');
    } catch (err: any) {
      setError(err.message || '密碼重設失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理搜尋
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const results = await searchEmployees(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || '搜尋失敗');
    } finally {
      setLoading(false);
    }
  };

  // 重設表單
  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      position: '',
      hireDate: new Date().toISOString().split('T')[0],
      department: '',
      salary: 0
    });
    setSelectedEmployee(null);
    setIsEditing(false);
  };

  const resetAccountForm = () => {
    setAccountForm({
      employeeId: '',
      username: '',
      email: '',
      password: '',
      role: 'staff'
    });
  };

  // 開啟員工對話框
  const openEmployeeDialog = (employee?: EmployeeWithAccount) => {
    if (employee) {
      setEmployeeForm({
        name: employee.name,
        phone: employee.phone,
        email: employee.email || '',
        address: employee.address || '',
        position: employee.position,
        hireDate: employee.hireDate.toString().split('T')[0],
        department: employee.department || '',
        salary: employee.salary || 0
      });
      setSelectedEmployee(employee);
      setIsEditing(true);
    } else {
      resetEmployeeForm();
    }
    setEmployeeDialog(true);
  };

  // 開啟帳號對話框
  const openAccountDialog = (employee: EmployeeWithAccount) => {
    setSelectedEmployee(employee);
    if (employee.account) {
      setAccountForm({
        employeeId: employee._id,
        username: employee.account.username,
        email: employee.account.email || '',
        password: '',
        role: employee.account.role
      });
    } else {
      setAccountForm({
        employeeId: employee._id,
        username: '',
        email: employee.email || '',
        password: '',
        role: 'staff'
      });
    }
    setAccountDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        員工服務 V2 範例
      </Typography>

      {/* 錯誤和成功訊息 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {/* 統計卡片 */}
      {employeeStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  總員工數
                </Typography>
                <Typography variant="h5">
                  {employeeStats.totalEmployees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  啟用帳號
                </Typography>
                <Typography variant="h5" color="success.main">
                  {employeeStats.activeEmployees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  有帳號
                </Typography>
                <Typography variant="h5" color="info.main">
                  {employeeStats.withAccounts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  無帳號
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {employeeStats.withoutAccounts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 主要內容 */}
      <Card>
        <CardContent>
          {/* 標籤頁 */}
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="員工管理" />
            <Tab label="搜尋功能" />
            <Tab label="業務邏輯示範" />
          </Tabs>

          {/* 員工管理標籤頁 */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openEmployeeDialog()}
              >
                新增員工
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => { loadEmployees(); loadStats(); }}
                disabled={loading}
              >
                重新載入
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>姓名</TableCell>
                    <TableCell>職位</TableCell>
                    <TableCell>電話</TableCell>
                    <TableCell>部門</TableCell>
                    <TableCell>帳號狀態</TableCell>
                    <TableCell>工作年資</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell>
                        {employeeServiceV2.formatEmployeeDisplayName(employee)}
                        {employeeServiceV2.isUpcomingBirthday(employee.birthDate || '') && (
                          <Chip
                            label="生日將至"
                            size="small"
                            color="warning"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={employeeServiceV2.formatEmployeeStatus(employee)}
                          color={employeeServiceV2.getEmployeeStatusColor(employee)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {employeeServiceV2.calculateWorkYears(employee.hireDate)} 年
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => openEmployeeDialog(employee)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openAccountDialog(employee)}
                        >
                          <AccountIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEmployeeDelete(employee)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* 搜尋功能標籤頁 */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <TextField
                label="搜尋員工"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
              >
                搜尋
              </Button>
            </Box>

            {searchResults.length > 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>姓名</TableCell>
                      <TableCell>職位</TableCell>
                      <TableCell>電話</TableCell>
                      <TableCell>電子郵件</TableCell>
                      <TableCell>部門</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((employee) => (
                      <TableRow key={employee._id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.phone}</TableCell>
                        <TableCell>{employee.email || '-'}</TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* 業務邏輯示範標籤頁 */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              業務邏輯方法示範
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      權限檢查示範
                    </Typography>
                    {employees.slice(0, 3).map((employee) => (
                      employee.account && (
                        <Box key={employee._id} sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            {employee.name} ({employeeServiceV2.formatRoleDisplayName(employee.account.role)})
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            管理員工: {employeeServiceV2.checkEmployeePermission(employee.account, 'manage_employees') ? '✓' : '✗'} |
                            管理庫存: {employeeServiceV2.checkEmployeePermission(employee.account, 'manage_inventory') ? '✓' : '✗'} |
                            基本操作: {employeeServiceV2.checkEmployeePermission(employee.account, 'basic_operations') ? '✓' : '✗'}
                          </Typography>
                        </Box>
                      )
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      資料驗證示範
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      測試無效員工資料：
                    </Typography>
                    <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                      <Typography variant="caption" component="pre">
                        {JSON.stringify(
                          employeeServiceV2.validateEmployeeData({
                            name: '',
                            phone: '',
                            position: '',
                            hireDate: '',
                            email: 'invalid-email',
                            salary: -1000
                          }),
                          null,
                          2
                        )}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>

      {/* 員工對話框 */}
      <Dialog open={employeeDialog} onClose={() => setEmployeeDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? '編輯員工' : '新增員工'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="姓名 *"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="電話 *"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="職位 *"
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="部門"
                value={employeeForm.department}
                onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="電子郵件"
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="到職日期 *"
                type="date"
                value={employeeForm.hireDate}
                onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="薪資"
                type="number"
                value={employeeForm.salary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, salary: Number(e.target.value) })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="地址"
                value={employeeForm.address}
                onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmployeeDialog(false)}>取消</Button>
          <Button onClick={handleEmployeeSubmit} variant="contained" disabled={loading}>
            {isEditing ? '更新' : '創建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 帳號對話框 */}
      <Dialog open={accountDialog} onClose={() => setAccountDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEmployee?.account ? '編輯帳號' : '創建帳號'} - {selectedEmployee?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="使用者名稱 *"
                value={accountForm.username}
                onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="電子郵件"
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={selectedEmployee?.account ? '新密碼（留空表示不更改）' : '密碼 *'}
                type="password"
                value={accountForm.password}
                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>角色 *</InputLabel>
                <Select
                  value={accountForm.role}
                  onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value as any })}
                >
                  <MenuItem value="staff">員工</MenuItem>
                  <MenuItem value="pharmacist">藥師</MenuItem>
                  <MenuItem value="admin">管理員</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {selectedEmployee?.account && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedEmployee.account.isActive}
                        onChange={() => handleAccountToggle(selectedEmployee)}
                      />
                    }
                    label="帳號啟用"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => handlePasswordReset(selectedEmployee)}
                    fullWidth
                  >
                    重設密碼
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleAccountDelete(selectedEmployee)}
                    fullWidth
                  >
                    刪除帳號
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialog(false)}>取消</Button>
          <Button onClick={handleAccountSubmit} variant="contained" disabled={loading}>
            {selectedEmployee?.account ? '更新' : '創建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeServiceV2Example;