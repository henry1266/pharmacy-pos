import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Typography, 
  Paper, 
  Box, 
  Container, 
  Alert, 
  Button,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  Toolbar,
  Tooltip,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// 定義介面
interface User {
  _id: string;
  name: string;
  role: string;
  email: string;
}

interface Employee {
  _id: string;
  name: string;
  gender: 'male' | 'female';
  department: string;
  position: string;
  phone: string;
  hireDate: string;
  email?: string;
  address?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: Date;
}

interface EmployeeListData {
  employees: Employee[];
  totalCount: number;
  page: number;
  limit: number;
}

/**
 * 型別守衛：檢查員工資料是否有效
 */
const isValidEmployee = (employee: any): employee is Employee => {
  return employee &&
         typeof employee._id === 'string' &&
         typeof employee.name === 'string' &&
         (employee.gender === 'male' || employee.gender === 'female') &&
         typeof employee.department === 'string' &&
         typeof employee.position === 'string' &&
         typeof employee.phone === 'string';
};

/**
 * 員工列表頁面
 * 顯示所有員工的基本資料，提供搜尋、排序、新增、編輯、刪除功能
 * 從 MongoDB 獲取真實資料
 */
const EmployeeListPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();

  // 從 API 獲取員工資料
  const fetchEmployees = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未登入或權限不足');
      }

      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      // 構建 API 請求 URL，包含分頁和搜尋參數
      const url = `/api/employees?page=${page}&limit=${rowsPerPage}&search=${searchTerm}`;
      
      const response = await axios.get<ApiResponse<EmployeeListData>>(url, config);
      
      // 確保 response.data.data 存在且包含 employees 陣列
      if (response.data.success && response.data.data && Array.isArray(response.data.data.employees)) {
        // 過濾並驗證員工資料
        const validEmployees = response.data.data.employees.filter(isValidEmployee);
        setEmployees(validEmployees);
        setTotalCount(response.data.data.totalCount ?? 0);
      } else {
        // 如果回應結構不正確，設為空陣列
        console.warn('API 回應結構不正確:', response.data);
        setEmployees([]);
        setTotalCount(0);
      }
      setError(null);
    } catch (err: any) {
      console.error('獲取員工資料失敗:', err);
      setError(err.response?.data?.msg ?? '獲取員工資料失敗');
      setEmployees([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 初始化時獲取用戶資訊和員工資料
  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        setError("無法讀取用戶資訊");
      }
    }

    // 獲取員工資料
    fetchEmployees();
  }, [page, rowsPerPage]); // 移除 fetchEmployees 依賴

  // 當搜尋條件變更時，重置頁碼並重新獲取資料
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setPage(0);
      fetchEmployees();
    }, 500); // 延遲 500ms 再執行搜尋，避免頻繁請求

    return () => clearTimeout(delaySearch);
  }, [searchTerm]); // 移除 fetchEmployees 依賴

  // 檢查用戶是否為管理員
  const isAdmin = user && user.role === 'admin';

  // 處理頁碼變更
  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  // 處理每頁顯示筆數變更
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 處理搜尋
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  };

  // 處理新增員工
  const handleAddEmployee = (): void => {
    navigate('/employees/basic-info/new');
  };

  // 處理編輯員工
  const handleEditEmployee = (id: string): void => {
    navigate(`/employees/basic-info/${id}`);
  };

  // 處理刪除員工對話框開啟
  const handleOpenDeleteDialog = (employee: Employee): void => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  // 處理刪除員工對話框關閉
  const handleCloseDeleteDialog = (): void => {
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  // 處理確認刪除員工
  const handleConfirmDelete = async (): Promise<void> => {
    if (employeeToDelete) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登入或權限不足');
        }

        const config = {
          headers: {
            'x-auth-token': token
          }
        };

        await axios.delete(`/api/employees/${employeeToDelete._id}`, config);
        
        // 刪除成功後重新獲取資料
        fetchEmployees();
        
        // 顯示成功訊息
        setSnackbar({
          open: true,
          message: '員工資料已成功刪除',
          severity: 'success'
        });
      } catch (err: any) {
        console.error('刪除員工資料失敗:', err);
        setSnackbar({
          open: true,
          message: err.response?.data?.msg ?? '刪除員工資料失敗',
          severity: 'error'
        });
      } finally {
        handleCloseDeleteDialog();
      }
    }
  };

  // 處理點擊員工行
  const handleRowClick = (id: string): void => {
    navigate(`/employees/basic-info/${id}`);
  };

  // 處理關閉提示訊息
  const handleCloseSnackbar = (): void => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 格式化日期
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0] || '';
  };

  // 如果正在載入，顯示載入中訊息
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>載入中...</Typography>
        </Paper>
      </Container>
    );
  }

  // 如果非管理員，顯示無權限訊息
  if (!isAdmin) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            您沒有權限訪問此頁面。只有管理員可以查看員工列表。
          </Alert>
          <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')}>
            返回儀表板
          </Button>
        </Paper>
      </Container>
    );
  }

  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')}>
            返回儀表板
          </Button>
        </Paper>
      </Container>
    );
  }

  // 管理員可見的內容
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            儀表板
          </Link>
          <Typography color="text.primary">員工列表</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            員工列表
          </Typography>
          
          <TextField
            variant="outlined"
            size="small"
            placeholder="搜尋員工..."
            value={searchTerm}
            onChange={handleSearch}
            sx={{ mr: 2, width: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Tooltip title="新增員工">
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddEmployee}
            >
              新增員工
            </Button>
          </Tooltip>
        </Toolbar>
        
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                <TableCell>姓名</TableCell>
                <TableCell>性別</TableCell>
                <TableCell>部門</TableCell>
                <TableCell>職位</TableCell>
                <TableCell>電話</TableCell>
                <TableCell>到職日期</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees && employees.length > 0 ? employees.map((employee) => (
                <TableRow
                  hover
                  key={employee._id}
                  onClick={() => handleRowClick(employee._id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell component="th" scope="row">
                    {employee.name}
                  </TableCell>
                  <TableCell>{employee.gender === 'male' ? '男' : '女'}</TableCell>
                  <TableCell>
                    <Chip label={employee.department} size="small" />
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell>{formatDate(employee.hireDate)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="編輯">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEmployee(employee._id);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="刪除">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteDialog(employee);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )) : null}
              {(!employees || employees.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchTerm ? '沒有符合搜尋條件的員工' : '目前沒有員工資料'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每頁顯示筆數:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 筆`}
        />
      </Paper>

      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"確認刪除員工資料"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            您確定要刪除 {employeeToDelete?.name} 的資料嗎？此操作無法復原。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            確認刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmployeeListPage;