import React, { useState, useEffect } from 'react';
import { 
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  Container,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel // Added for sorting
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import zhTW from 'date-fns/locale/zh-TW';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAccountingCategories } from '../services/accountingCategoryService';
import StatusSelect from '../components/common/form/StatusSelect'; // Import StatusSelect

/**
 * 記帳新增頁面
 * 將原本的彈出視窗改為獨立頁面
 */
const AccountingNewPage = () => {
  const navigate = useNavigate();
  
  // 記帳名目類別狀態
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errorCategories, setErrorCategories] = useState(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    date: new Date(),
    shift: 
    status: 'pending', // Add status field with default 'pending'
    items: [
      { amount: '', category: '', categoryId: '', note: '' },
      { amount: '', category: '', categoryId: '', note: '' }
    ]
  });

  // 銷售監測狀態
  // Removed monitoredProductCode state
  const [unaccountedSales, setUnaccountedSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesError, setSalesError] = useState(null);
  const [order, setOrder] = useState('asc'); // Sort order
  const [orderBy, setOrderBy] = useState('lastUpdated'); // Sort by column
  
  // 獲取記帳名目類別
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getAccountingCategories();
        setCategories(data);
        
        if (data.length > 0) {
          const updatedItems = formData.items.map((item, index) => {
            if (index < 2 && data[index]) {
              return {
                ...item,
                category: data[index].name,
                categoryId: data[index]._id
              };
            }
            return item;
          });
          
          setFormData(prevState => ({
            ...prevState,
            items: updatedItems
          }));
        }
        
        setErrorCategories(null);
      } catch (err) {
        console.error('獲取記帳名目類別失敗:', err);
        setErrorCategories('獲取記帳名目類別失敗');
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 獲取未標記銷售記錄 (Modified to fetch all monitored products)
  useEffect(() => {
    const fetchUnaccountedSales = async () => {
      if (!formData.date) {
        setUnaccountedSales([]);
        return;
      }
      setLoadingSales(true);
      setSalesError(null);
      try {
        const formattedDate = format(formData.date, 'yyyy-MM-dd');
        // Updated API call - no productCode needed
        const response = await axios.get('/api/accounting/unaccounted-sales', {
          params: {
            date: formattedDate,
          },
        });
        setUnaccountedSales(response.data);
      } catch (err) {
        console.error('獲取未標記銷售記錄失敗:', err);
        setSalesError(err.response?.data?.msg || '獲取未標記銷售記錄失敗');
        setUnaccountedSales([]);
      } finally {
        setLoadingSales(false);
      }
    };

    fetchUnaccountedSales();
  }, [formData.date]); // Only depends on date now
  
  // 提示訊息狀態
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
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
    
    if (field === 'category' && value === '退押金') {
      const currentAmount = updatedItems[index].amount;
      if (currentAmount > 0) {
        updatedItems[index].amount = -Math.abs(currentAmount);
      } 
    }
    
    if (field === 'amount' && updatedItems[index].category === '退押金' && value !== '') {
      updatedItems[index][field] = -Math.abs(parseFloat(value));
    } else {
      updatedItems[index][field] = field === 'amount' ? (value === '' ? '' : parseFloat(value)) : value;
    }
    
    if (field === 'category' && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.name === value);
      if (selectedCategory) {
        updatedItems[index].categoryId = selectedCategory._id;
      }
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // 新增項目
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { amount: '', category: '', categoryId: '', note: '' }]
    });
  };
  
  // 刪除項目
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems.length ? updatedItems : [{ amount: '', category: '', categoryId: '', note: '' }]
    });
  };
  
  // 計算總金額
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };
  
  // 顯示提示訊息
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  
  // 返回記帳列表頁面
  const handleBack = () => {
    navigate('/accounting');
  };
  
  // 提交表單
  const handleSubmit = async () => {
    try {
      if (!formData.date) {
        showSnackbar('請選擇日期', 'error');
        return;
      }
      
      if (!formData.shift) {
        showSnackbar('請選擇班別', 'error');
        return;
      }
      
      const validItems = formData.items.filter(
        item => item.amount !== '' && item.category !== ''
      );
      
      if (validItems.length === 0) {
        showSnackbar('至少需要一個有效的項目 (金額和名目皆需填寫)', 'error');
        return;
      }
      
      const submitData = {
        ...formData, // Includes status now
        date: format(formData.date, 'yyyy-MM-dd'),
        items: validItems
      };
      
      await axios.post('/api/accounting', submitData);
      showSnackbar('記帳記錄已新增', 'success');
      
      setTimeout(() => {
        navigate('/accounting');
      }, 1500);
    } catch (err) {
      console.error('提交記帳記錄失敗:', err);
      showSnackbar(err.response?.data?.msg || '提交記帳記錄失敗', 'error');
    }
  };

  // --- Sorting Logic ---
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    let valA = a[orderBy];
    let valB = b[orderBy];

    // Handle nested properties like product.code
    if (orderBy.includes('.')) {
      const keys = orderBy.split('.');
      valA = keys.reduce((obj, key) => obj && obj[key], a);
      valB = keys.reduce((obj, key) => obj && obj[key], b);
    }

    // Handle date sorting
    if (orderBy === 'lastUpdated') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (valB < valA) {
      return -1;
    }
    if (valB > valA) {
      return 1;
    }
    return 0;
  };

  const sortedSales = stableSort(unaccountedSales, getComparator(order, orderBy));
  // --- End Sorting Logic ---

  // Table Headers
  const headCells = [
    { id: 'lastUpdated', label: '時間', numeric: false },
    { id: 'product.code', label: '產品編號', numeric: false }, // Added Product Code
    { id: 'product.name', label: '產品名稱', numeric: false }, // Added Product Name
    { id: 'quantity', label: '數量', numeric: true },
    { id: 'totalAmount', label: '金額', numeric: true },
    { id: 'saleNumber', label: '銷售單號', numeric: false },
  ];

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            新增記帳記錄
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* 日期與班別選擇 */}
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
          <Grid item xs={12} sm={4}> {/* Adjust grid size */}
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
          <Grid item xs={12} sm={4}> {/* Add StatusSelect grid item */}
            <StatusSelect 
              value={formData.status}
              onChange={handleFormChange} // Use handleFormChange for status too
            />
          </Grid>
          
          {/* 項目列表 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              記帳項目
            </Typography>
            
            {formData.items.map((item, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="金額"
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                    fullWidth
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: item.category === '退押金' ? 'error.main' : undefined,
                          borderWidth: item.category === '退押金' ? 2 : 1
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: item.category === '退押金' ? 'error.main' : 'primary.main'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: item.category === '退押金' ? 'error.main' : 'inherit'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth required>
                    <InputLabel>名目</InputLabel>
                    <Select
                      value={item.category}
                      label="名目"
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      disabled={loadingCategories}
                    >
                      {loadingCategories ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          載入中...
                        </MenuItem>
                      ) : errorCategories ? (
                        <MenuItem disabled>
                          <Typography color="error" variant="body2">無法載入名目</Typography>
                        </MenuItem>
                      ) : categories.length > 0 ? (
                        categories.map(category => (
                          <MenuItem key={category._id} value={category.name}>
                            {category.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          無可用名目
                        </MenuItem>
                      )}
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
                <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
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

          {/* 銷售監測區塊 (Modified) */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, backgroundColor: '#f9f9f9' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">
                  監測產品 - 當日未結算銷售
                </Typography>
                {/* Removed product code input */}
              </Box>
              {loadingSales ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : salesError ? (
                <Alert severity="error">{salesError}</Alert>
              ) : sortedSales.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                  今日尚無已設定監測產品的未結算銷售記錄，或未設定監測產品。
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 300 }}> {/* Increased height */}
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { backgroundColor: '#eee', fontWeight: 'bold' } }}>
                        {headCells.map((headCell) => (
                          <TableCell
                            key={headCell.id}
                            align={headCell.numeric ? 'right' : 'left'}
                            sortDirection={orderBy === headCell.id ? order : false}
                          >
                            <TableSortLabel
                              active={orderBy === headCell.id}
                              direction={orderBy === headCell.id ? order : 'asc'}
                              onClick={() => handleRequestSort(headCell.id)}
                            >
                              {headCell.label}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedSales.map((sale) => (
                        <TableRow key={sale._id} hover sx={{ '&:hover': { backgroundColor: '#f0f0f0' } }}>
                          <TableCell>
                            {format(new Date(sale.lastUpdated), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell>{sale.product?.code || 'N/A'}</TableCell> {/* Display Product Code */}
                          <TableCell>{sale.product?.name || 'N/A'}</TableCell> {/* Display Product Name */}
                          <TableCell align="right">{sale.quantity}</TableCell>
                          <TableCell align="right">${sale.totalAmount?.toFixed(2) ?? '0.00'}</TableCell>
                          <TableCell>{sale.saleNumber}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
          
          {/* 總金額與按鈕 */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" align="right">
              記帳總金額: ${(calculateTotal(formData.items) + sortedSales.reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || 0), 0)).toFixed(2)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleBack} sx={{ mr: 2 }}>
              取消
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              儲存
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 提示訊息 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AccountingNewPage;

