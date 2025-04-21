import React, { useState } from 'react';
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
  Container
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

/**
 * 記帳新增頁面
 * 將原本的彈出視窗改為獨立頁面
 */
const AccountingNewPage = () => {
  const navigate = useNavigate();
  
  // 表單狀態
  const [formData, setFormData] = useState({
    date: new Date(),
    shift: '',
    items: [
      { amount: '', category: '掛號費', note: '' },
      { amount: '', category: '部分負擔', note: '' }
    ]
  });
  
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
      
      // 新增記錄
      await axios.post('/api/accounting', submitData);
      showSnackbar('記帳記錄已新增', 'success');
      
      // 重置表單或導航回列表頁面
      setTimeout(() => {
        navigate('/accounting');
      }, 1500);
    } catch (err) {
      console.error('提交記帳記錄失敗:', err);
      showSnackbar(err.response?.data?.msg || '提交記帳記錄失敗', 'error');
    }
  };

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
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleBack} sx={{ mr: 2 }}>
              取消
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              新增
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
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
    </Container>
  );
};

export default AccountingNewPage;
