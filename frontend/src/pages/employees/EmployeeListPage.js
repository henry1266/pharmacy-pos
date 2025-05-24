import React, { useState, useEffect } from 'react';
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
  DialogTitle
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';

/**
 * 員工列表頁面
 * 顯示所有員工的基本資料，提供搜尋、排序、新增、編輯、刪除功能
 */
const EmployeeListPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const navigate = useNavigate();

  // 模擬員工資料
  const mockEmployees = [
    { id: '1', name: '王大明', gender: '男', department: '藥劑部', position: '藥師', phone: '0912-345-678', hireDate: '2020-01-15' },
    { id: '2', name: '李小華', gender: '女', department: '行政部', position: '行政助理', phone: '0923-456-789', hireDate: '2021-03-20' },
    { id: '3', name: '張美玲', gender: '女', department: '藥劑部', position: '資深藥師', phone: '0934-567-890', hireDate: '2018-05-10' },
    { id: '4', name: '陳志明', gender: '男', department: '資訊部', position: '系統工程師', phone: '0945-678-901', hireDate: '2022-02-01' },
    { id: '5', name: '林雅婷', gender: '女', department: '行政部', position: '人資專員', phone: '0956-789-012', hireDate: '2019-11-15' },
    { id: '6', name: '黃建志', gender: '男', department: '藥劑部', position: '藥師助理', phone: '0967-890-123', hireDate: '2021-07-05' },
    { id: '7', name: '吳佳穎', gender: '女', department: '客服部', position: '客服專員', phone: '0978-901-234', hireDate: '2020-09-30' },
    { id: '8', name: '趙明宏', gender: '男', department: '管理部', position: '部門主管', phone: '0989-012-345', hireDate: '2017-04-18' },
    { id: '9', name: '周雅文', gender: '女', department: '藥劑部', position: '實習藥師', phone: '0990-123-456', hireDate: '2023-01-10' },
    { id: '10', name: '謝宗翰', gender: '男', department: '資訊部', position: '前端工程師', phone: '0901-234-567', hireDate: '2022-06-20' },
    { id: '11', name: '鄭美珍', gender: '女', department: '行政部', position: '會計專員', phone: '0912-345-678', hireDate: '2020-03-15' },
    { id: '12', name: '楊志豪', gender: '男', department: '管理部', position: '專案經理', phone: '0923-456-789', hireDate: '2019-08-01' },
  ];

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

    // 模擬從 API 獲取員工資料
    setTimeout(() => {
      setEmployees(mockEmployees);
      setTotalCount(mockEmployees.length);
      setLoading(false);
    }, 800);
  }, []);

  // 檢查用戶是否為管理員
  const isAdmin = user && user.role === 'admin';

  // 處理頁碼變更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 處理每頁顯示筆數變更
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 處理搜尋
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // 處理新增員工
  const handleAddEmployee = () => {
    navigate('/employees/basic-info/new');
  };

  // 處理編輯員工
  const handleEditEmployee = (id) => {
    navigate(`/employees/basic-info/${id}`);
  };

  // 處理刪除員工對話框開啟
  const handleOpenDeleteDialog = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  // 處理刪除員工對話框關閉
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  // 處理確認刪除員工
  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      // 模擬刪除操作
      setEmployees(employees.filter(employee => employee.id !== employeeToDelete.id));
      setTotalCount(prev => prev - 1);
      handleCloseDeleteDialog();
    }
  };

  // 處理點擊員工行
  const handleRowClick = (id) => {
    navigate(`/employees/basic-info/${id}`);
  };

  // 過濾員工資料
  const filteredEmployees = employees.filter(employee => 
    employee.name.includes(searchTerm) || 
    employee.department.includes(searchTerm) || 
    employee.position.includes(searchTerm)
  );

  // 分頁後的員工資料
  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
              {paginatedEmployees.map((employee) => (
                <TableRow
                  hover
                  key={employee.id}
                  onClick={() => handleRowClick(employee.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell component="th" scope="row">
                    {employee.name}
                  </TableCell>
                  <TableCell>{employee.gender}</TableCell>
                  <TableCell>
                    <Chip label={employee.department} size="small" />
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell>{employee.hireDate}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="編輯">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEmployee(employee.id);
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
              ))}
              {paginatedEmployees.length === 0 && (
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
          count={filteredEmployees.length}
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
    </Container>
  );
};

export default EmployeeListPage;
