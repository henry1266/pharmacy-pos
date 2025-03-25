import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button as MuiButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';
import axios from 'axios';

/**
 * 會員管理頁面組件
 * @returns {React.ReactElement} 會員管理頁面
 */
const CustomersPage = () => {
  // 會員數據狀態
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 表單狀態
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    points: 0,
    membershipLevel: 'regular'
  });

  // 獲取所有會員數據
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const response = await axios.get('/api/customers', config);
      
      // 將後端數據格式轉換為前端格式
      const formattedCustomers = response.data.map(customer => ({
        id: customer._id,
        code: customer.code,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        points: customer.points || 0,
        level: mapMembershipLevel(customer.membershipLevel)
      }));
      
      setCustomers(formattedCustomers);
      setLoading(false);
    } catch (err) {
      console.error('獲取會員數據失敗:', err);
      setError('獲取會員數據失敗');
      setLoading(false);
    }
  };

  // 將後端會員等級映射為前端顯示文本
  const mapMembershipLevel = (level) => {
    const levelMap = {
      'regular': '一般會員',
      'silver': '銀卡會員',
      'gold': '金卡會員',
      'platinum': '白金會員'
    };
    return levelMap[level] || '一般會員';
  };

  // 將前端會員等級映射為後端值 (目前未使用，但保留以備將來使用)
  /* const mapLevelToMembershipLevel = (level) => {
    const levelMap = {
      '一般會員': 'regular',
      '銀卡會員': 'silver',
      '金卡會員': 'gold',
      '白金會員': 'platinum'
    };
    return levelMap[level] || 'regular';
  }; */

  // 組件掛載時獲取數據
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // 表格列配置
  const columns = [
    { field: 'code', headerName: '會員編號', width: 120 },
    { field: 'name', headerName: '會員姓名', width: 120 },
    { field: 'phone', headerName: '電話', width: 150 },
    { field: 'email', headerName: '電子郵件', width: 200 },
    { field: 'address', headerName: '地址', width: 300 },
    { field: 'points', headerName: '積分', width: 100, type: 'number' },
    { field: 'level', headerName: '會員等級', width: 120 },
    {
      field: 'actions',
      headerName: '操作',
      width: 150,
      renderCell: (params) => (
        <Box>
          <MuiButton size="small" onClick={() => handleEdit(params.row.id)}>編輯</MuiButton>
          <MuiButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>刪除</MuiButton>
        </Box>
      ),
    },
  ];

  // 處理表單輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 確保空值能夠正確清空欄位
    const processedValue = value === '' && name !== 'points' ? '' : 
                          name === 'points' ? (value === '' ? 0 : Number(value)) : value;
    
    setCurrentCustomer({
      ...currentCustomer,
      [name]: processedValue
    });
  };

  // 處理編輯會員
  const handleEdit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const response = await axios.get(`/api/customers/${id}`, config);
      const customer = response.data;
      
      setCurrentCustomer({
        id: customer._id,
        code: customer.code,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        points: customer.points || 0,
        membershipLevel: customer.membershipLevel || 'regular'
      });
      
      setEditMode(true);
      setOpenDialog(true);
    } catch (err) {
      console.error('獲取會員詳情失敗:', err);
      setError('獲取會員詳情失敗');
    }
  };

  // 處理刪除會員
  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此會員嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        await axios.delete(`/api/customers/${id}`, config);
        
        // 更新本地狀態
        setCustomers(customers.filter(customer => customer.id !== id));
      } catch (err) {
        console.error('刪除會員失敗:', err);
        setError('刪除會員失敗');
      }
    }
  };

  // 處理添加會員
  const handleAddCustomer = () => {
    setCurrentCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      points: 0,
      membershipLevel: 'regular'
    });
    setEditMode(false);
    setOpenDialog(true);
  };

  // 處理關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 處理保存會員
  const handleSaveCustomer = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const customerData = {
        name: currentCustomer.name,
        phone: currentCustomer.phone,
        email: currentCustomer.email,
        address: currentCustomer.address,
        points: currentCustomer.points,
        membershipLevel: currentCustomer.membershipLevel
      };
      
      if (editMode) {
        // 更新會員
        await axios.put(`/api/customers/${currentCustomer.id}`, customerData, config);
      } else {
        // 創建會員
        await axios.post('/api/customers', customerData, config);
      }
      
      // 關閉對話框並重新獲取數據
      setOpenDialog(false);
      fetchCustomers();
    } catch (err) {
      console.error('保存會員失敗:', err);
      setError('保存會員失敗');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          會員管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          添加會員
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 0 }}>
            <DataTable
              rows={customers}
              columns={columns}
              pageSize={10}
              checkboxSelection
              loading={loading}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* 會員表單對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯會員' : '添加會員'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="name"
              label="會員姓名"
              value={currentCustomer.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="phone"
              label="電話"
              value={currentCustomer.phone}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="email"
              label="電子郵件"
              value={currentCustomer.email}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="address"
              label="地址"
              value={currentCustomer.address}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="points"
              label="積分"
              type="number"
              value={currentCustomer.points}
              onChange={handleInputChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>會員等級</InputLabel>
              <Select
                name="membershipLevel"
                value={currentCustomer.membershipLevel}
                onChange={handleInputChange}
                label="會員等級"
              >
                <MenuItem value="regular">一般會員</MenuItem>
                <MenuItem value="silver">銀卡會員</MenuItem>
                <MenuItem value="gold">金卡會員</MenuItem>
                <MenuItem value="platinum">白金會員</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            取消
          </Button>
          <Button onClick={handleSaveCustomer} color="primary" variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;
