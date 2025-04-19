import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import zhTW from 'date-fns/locale/zh-TW';
import axios from 'axios';
import { format } from 'date-fns';

const AccountingPage = () => {
  // 狀態管理
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // 篩選條件
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterShift, setFilterShift] = useState('');
  
  // 表單資料
  const [formData, setFormData] = useState({
    date: new Date(),
    shift: '',
    items: [{ amount: '', category: '', note: '' }]
  });
  
  // 載入記帳記錄
  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = '/api/accounting';
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      }
      
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      }
      
      if (filterShift) {
        params.append('shift', filterShift);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setRecords(response.data);
      setError(null);
    } catch (err) {
      console.error('載入記帳記錄失敗:', err);
      setError('載入記帳記錄失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始載入
  useEffect(() => {
    fetchRecords();
  }, []);
  
  // 篩選條件變更時重新載入
  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate, filterShift]);
  
  // 處理表單變更
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 處理日期變更
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date
    });
  };
  
  // 處理項目變更
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'amount' ? (value === '' ? '' : parseFloat(value)) : value
    };
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // 新增項目
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { amount: '', category: '', note: '' }]
    });
  };
  
  // 刪除項目
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems.length ? updatedItems : [{ amount: '', category: '', note: '' }]
    });
  };
  
  // 開啟新增對話框
  const handleOpenAddDialog = () => {
    setFormData({
      date: new Date(),
      shift: '',
      items: [{ amount: '', category: '', note: '' }]
    });
    setEditMode(false);
    setCurrentId(null);
    setOpenDialog(true);
  };
  
  // 開啟編輯對話框
  const handleOpenEditDialog = (record) => {
    setFormData({
      date: new Date(record.date),
      shift: record.shift,
      items: record.items.map(item => ({
        amount: item.amount,
        category: item.category,
        note: item.note || ''
      }))
    });
    setEditMode(true);
    setCurrentId(record._id);
    setOpenDialog(true);
  };
  
  // 關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // 提交表單
  const handleSubmit = async () => {
    try {
      // 驗證表單
      if (!formData.date) {
        showSnackbar('請選擇日期', 'error');
        return;
      }
      
      if (!formData.shift) {
        showSnackbar('請選擇班別', 'error');
        return;
      }
      
      const validItems = formData.items.filter(
        item => item.amount && item.category
      );
      
      if (validItems.length === 0) {
        showSnackbar('至少需要一個有效的項目', 'error');
        return;
      }
      
      const submitData = {
        ...formData,
        date: format(formData.date, 'yyyy-MM-dd'),
        items: validItems
      };
      
      if (editMode) {
        // 更新記錄
        await axios.put(`/api/accounting/${currentId}`, submitData);
        showSnackbar('記帳記錄已更新', 'success');
      } else {
        // 新增記錄
        await axios.post('/api/accounting', submitData);
        showSnackbar('記帳記錄已新增', 'success');
      }
      
      handleCloseDialog();
      fetchRecords();
    } catch (err) {
      console.error('提交記帳記錄失敗:', err);
      showSnackbar(err.response?.data?.msg || '提交記帳記錄失敗', 'error');
    }
  };
  
  // 刪除記錄
  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此記帳記錄嗎？')) {
      try {
        await axios.delete(`/api/accounting/${id}`);
        showSnackbar('記帳記錄已刪除', 'success');
        fetchRecords();
      } catch (err) {
        console.error('刪除記帳記錄失敗:', err);
        showSnackbar('刪除記帳記錄失敗', 'error');
      }
    }
  };
  
  // 顯示提示訊息
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  
  // 計算總金額
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        記帳系統
      </Typography>
      
      {/* 篩選區域 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="開始日期"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="結束日期"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>班別</InputLabel>
              <Select
                value={filterShift}
                label="班別"
                onChange={(e) => setFilterShift(e.target.value)}
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="早">早班</MenuItem>
                <MenuItem value="中">中班</MenuItem>
                <MenuItem value="晚">晚班</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              fullWidth
            >
              新增記帳
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 記帳記錄列表 */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="記帳記錄表格">
            <TableHead>
              <TableRow>
                <TableCell>日期</TableCell>
                <TableCell>班別</TableCell>
                <TableCell>項目</TableCell>
                <TableCell align="right">總金額</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">載入中...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'error.main' }}>
                    {error}
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">無記帳記錄</TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record._id} hover>
                    <TableCell>
                      {format(new Date(record.date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>{record.shift}班</TableCell>
                    <TableCell>
                      {record.items.map((item, index) => (
                        <div key={index}>
                          {item.category}: ${item.amount}
                          {item.note && ` (${item.note})`}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell align="right">${record.totalAmount}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(record)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(record._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* 新增/編輯對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? '編輯記帳記錄' : '新增記帳記錄'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                <DatePicker
                  label="日期"
                  value={formData.date}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>班別</InputLabel>
                <Select
                  name="shift"
                  value={formData.shift}
                  label="班別"
                  onChange={handleFormChange}
                >
                  <MenuItem value="早">早班</MenuItem>
                  <MenuItem value="中">中班</MenuItem>
                  <MenuItem value="晚">晚班</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* 項目列表 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                項目
              </Typography>
              
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="金額"
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth required>
                      <InputLabel>名目</InputLabel>
                      <Select
                        value={item.category}
                        label="名目"
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      >
                        <MenuItem value="掛號費">掛號費</MenuItem>
                        <MenuItem value="部分負擔">部分負擔</MenuItem>
                        <MenuItem value="其他">其他</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="備註"
                      value={item.note}
                      onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length <= 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{ mt: 1 }}
              >
                新增項目
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" align="right">
                總金額: ${calculateTotal(formData.items)}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 提示訊息 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountingPage;
