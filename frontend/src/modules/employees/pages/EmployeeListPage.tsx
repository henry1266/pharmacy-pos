import React, { useState, useEffect } from 'react';
import TitleWithCount from '../../../components/common/TitleWithCount';
import axios from 'axios';
import {
  Typography,
  Box,
  Alert,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  List,
  ListItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import CommonListPageLayout from '../../../components/common/CommonListPageLayout';

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

// 定義 EmployeeDetailPanel 屬性介面
interface EmployeeDetailPanelProps {
  selectedEmployee: Employee | null;
  handleEdit: (id: string) => void;
  handleDelete: (employee: Employee) => void;
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

// 員工詳情面板組件
const EmployeeDetailPanel: React.FC<EmployeeDetailPanelProps> = ({ selectedEmployee, handleEdit, handleDelete }) => {
  if (!selectedEmployee) {
    return (
      <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            選擇一個員工查看詳情
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 格式化日期
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0] || '';
  };

  return (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{selectedEmployee.name?.charAt(0) ?? 'E'}</Avatar>}
        title={<Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{selectedEmployee.name}</Typography>}
        subheader={`職位: ${selectedEmployee.position}`}
        action={
          <Box>
            <Tooltip title="編輯">
              <IconButton color="primary" onClick={() => handleEdit(selectedEmployee._id)} size="small"><EditIcon /></IconButton>
            </Tooltip>
            <Tooltip title="刪除">
              <IconButton color="error" onClick={() => handleDelete(selectedEmployee)} size="small"><DeleteIcon /></IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>員工資訊</Typography>
        <List dense sx={{ py: 0 }}>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>性別:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedEmployee.gender === 'male' ? '男' : '女'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>部門:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedEmployee.department}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>電話:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedEmployee.phone}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>到職日期:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(selectedEmployee.hireDate)}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>Email:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedEmployee.email ?? '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>地址:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedEmployee.address ?? '無'}</Typography></ListItem>
        </List>
      </CardContent>
    </Card>
  );
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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
        
        // 如果刪除的是當前選中的員工，清除選中狀態
        if (selectedEmployee && selectedEmployee._id === employeeToDelete._id) {
          setSelectedEmployee(null);
        }
        
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
  const handleRowClick = (params: any): void => {
    const employee = employees.find(emp => emp._id === params.row._id) || null;
    setSelectedEmployee(employee);
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

  // 定義表格列
  const columns = [
    {
      field: 'name',
      headerName: '姓名',
      width: 100
    },
    {
      field: 'gender',
      headerName: '性別',
      width: 60,
      valueGetter: (params: any) => params.row.gender === 'male' ? '男' : '女'
    },
    {
      field: 'department',
      headerName: '部門',
      width: 120,
      renderCell: (params: any) => (
        <Chip label={params.row.department} size="small" />
      )
    },
    {
      field: 'position',
      headerName: '職位',
      width: 120
    },
    {
      field: 'phone',
      headerName: '電話',
      width: 130
    },
    {
      field: 'hireDate',
      headerName: '到職日期',
      width: 140,
      valueGetter: (params: any) => formatDate(params.row.hireDate)
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 130,
      sortable: false,
      renderCell: (params: any) => (
        <Box>
          <Tooltip title="編輯">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleEditEmployee(params.row._id);
              }}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDeleteDialog(params.row);
              }}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // 定義操作按鈕
  const actionButtons = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        variant="outlined"
        size="small"
        placeholder="搜尋員工..."
        value={searchTerm}
        onChange={handleSearch}
        sx={{ width: '200px' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAddEmployee}
        sx={{ minWidth: '100px' }}
      >
        新增員工
      </Button>
    </Box>
  );

  // 如果非管理員，顯示無權限訊息
  if (!isAdmin) {
    return (
      <Box sx={{ width: '80%', mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          您沒有權限訪問此頁面。只有管理員可以查看員工列表。
        </Alert>
        <Button variant="outlined" color="primary" onClick={() => navigate('/dashboard')}>
          返回儀表板
        </Button>
      </Box>
    );
  }

  // 使用 CommonListPageLayout 組件
  return (
    <>
      <Box sx={{ width: '95%', mx: 'auto' }}>
        <CommonListPageLayout
          title={<TitleWithCount title="員工管理" count={totalCount} />}
          actionButtons={actionButtons}
          columns={columns}
          rows={employees.map(employee => ({...employee, id: employee._id}))}
          loading={loading}
          error={error || ""}
          onRowClick={handleRowClick}
          dataTableProps={{
            pageSize: rowsPerPage,
            onPageChange: (params: any) => handleChangePage(null, params.page),
            onPageSizeChange: (params: any) => handleChangeRowsPerPage({target: {value: params.pageSize}} as any),
            rowCount: totalCount,
            paginationMode: 'server',
            page: page
          }}
          detailPanel={
            <EmployeeDetailPanel
              selectedEmployee={selectedEmployee}
              handleEdit={handleEditEmployee}
              handleDelete={handleOpenDeleteDialog}
            />
          }
          tableGridWidth={9}
          detailGridWidth={3}
        />
      </Box>

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
    </>
  );
};

export default EmployeeListPage;