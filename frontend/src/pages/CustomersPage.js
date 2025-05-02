import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  List,
  ListItem,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import CommonListPageLayout from '../components/common/CommonListPageLayout'; // Import the common layout
import Button from '../components/common/Button'; // Keep custom Button if needed, or switch to MuiButton

/**
 * 會員管理頁面組件
 * @returns {React.ReactElement} 會員管理頁面
 */
const CustomersPage = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [selectedCustomer, setSelectedCustomer] = useState(null); // State for detail panel

  // Map membership level (remains the same)
  const mapMembershipLevel = useCallback((level) => {
    const levelMap = {
      'regular': '一般會員',
      'silver': '銀卡會員',
      'gold': '金卡會員',
      'platinum': '白金會員'
    };
    return levelMap[level] || '一般會員';
  }, []);

  // Fetch customers data (remains the same)
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
      const response = await axios.get('/api/customers', config);
      const formattedCustomers = response.data.map(customer => ({
        id: customer._id,
        code: customer.code,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        points: customer.points || 0,
        level: mapMembershipLevel(customer.membershipLevel),
        // Keep original level for editing
        membershipLevel: customer.membershipLevel || 'regular' 
      }));
      setCustomers(formattedCustomers);
      setLoading(false);
    } catch (err) {
      console.error('獲取會員數據失敗:', err);
      setError('獲取會員數據失敗');
      setLoading(false);
    }
  }, [setCustomers, setLoading, setError, mapMembershipLevel]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Table columns definition
  const columns = [
    { field: 'code', headerName: '會員編號', width: 120 },
    { field: 'name', headerName: '會員姓名', width: 120 },
    { field: 'phone', headerName: '電話', width: 150 },
    { field: 'email', headerName: '電子郵件', width: 200 },
    // { field: 'address', headerName: '地址', width: 300 }, // Removed for brevity, can be seen in detail panel
    { field: 'points', headerName: '積分', width: 100, type: 'number' },
    { field: 'level', headerName: '會員等級', width: 120 },
    {
      field: 'actions',
      headerName: '操作',
      width: 120, // Adjusted width
      renderCell: (params) => (
        <Box>
          <Tooltip title="編輯">
            <IconButton 
              size="small" 
              color="primary"
              onClick={(e) => { e.stopPropagation(); handleEdit(params.row.id); }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton 
              size="small" 
              color="error" 
              onClick={(e) => { e.stopPropagation(); handleDelete(params.row.id); }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Handler functions (remain mostly the same)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = value === '' && name !== 'points' ? '' : 
                          name === 'points' ? (value === '' ? 0 : Number(value)) : value;
    setCurrentCustomer({ ...currentCustomer, [name]: processedValue });
  };

  const handleEdit = async (id) => {
    // Fetch full customer data for editing, including original membershipLevel
    const customerToEdit = customers.find(c => c.id === id);
    if (customerToEdit) {
       setCurrentCustomer({
        id: customerToEdit.id,
        code: customerToEdit.code,
        name: customerToEdit.name,
        phone: customerToEdit.phone,
        email: customerToEdit.email || '',
        address: customerToEdit.address || '',
        points: customerToEdit.points || 0,
        membershipLevel: customerToEdit.membershipLevel || 'regular' // Use original level
      });
      setEditMode(true);
      setOpenDialog(true);
    } else {
       setError('無法找到要編輯的會員資料');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此會員嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        await axios.delete(`/api/customers/${id}`, config);
        setCustomers(customers.filter(customer => customer.id !== id));
        if (selectedCustomer && selectedCustomer.id === id) {
          setSelectedCustomer(null); // Clear selection if deleted customer was selected
        }
      } catch (err) {
        console.error('刪除會員失敗:', err);
        setError('刪除會員失敗');
      }
    }
  };

  const handleAddCustomer = () => {
    setCurrentCustomer({ name: '', phone: '', email: '', address: '', points: 0, membershipLevel: 'regular' });
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSaveCustomer = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
      const customerData = {
        name: currentCustomer.name,
        phone: currentCustomer.phone,
        email: currentCustomer.email === '' ? ' ' : currentCustomer.email,
        address: currentCustomer.address === '' ? ' ' : currentCustomer.address,
        points: currentCustomer.points,
        membershipLevel: currentCustomer.membershipLevel
      };
      
      if (editMode) {
        await axios.put(`/api/customers/${currentCustomer.id}`, customerData, config);
      } else {
        await axios.post('/api/customers', customerData, config);
      }
      setOpenDialog(false);
      fetchCustomers(); // Refresh list
    } catch (err) {
      console.error('保存會員失敗:', err);
      setError(`保存會員失敗: ${err.response?.data?.message || err.message}`);
      alert(`保存會員失敗: ${err.response?.data?.message || err.message}`);
    }
  };
  
  // Handler for row click to update detail panel
  const handleRowClick = (params) => {
      setSelectedCustomer(customers.find(c => c.id === params.row.id));
  };

  // Define Action Buttons for the layout header
  const actionButtons = (
    <MuiButton // Use MuiButton for consistency or keep custom Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      onClick={handleAddCustomer}
    >
      添加會員
    </MuiButton>
  );

  // Define Detail Panel for the layout
  const detailPanel = selectedCustomer ? (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>{selectedCustomer.name?.charAt(0) || 'C'}</Avatar>}
        title={<Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{selectedCustomer.name}</Typography>}
        subheader={`編號: ${selectedCustomer.code}`}
        action={
          <Box>
            <Tooltip title="編輯">
              <IconButton color="primary" onClick={() => handleEdit(selectedCustomer.id)} size="small"><EditIcon /></IconButton>
            </Tooltip>
            <Tooltip title="刪除">
              <IconButton color="error" onClick={() => handleDelete(selectedCustomer.id)} size="small"><DeleteIcon /></IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>會員資訊</Typography>
        <List dense sx={{ py: 0 }}>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>電話:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.phone}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>Email:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.email || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>地址:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.address || '無'}</Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>積分:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.points}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>等級:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.level}</Typography></ListItem>
        </List>
      </CardContent>
    </Card>
  ) : (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          選擇一個會員查看詳情
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
      <CommonListPageLayout
        title="會員管理"
        actionButtons={actionButtons}
        columns={columns}
        rows={customers}
        loading={loading}
        error={error}
        onRowClick={handleRowClick} // Pass the row click handler
        detailPanel={detailPanel}   // Pass the detail panel content
        tableGridWidth={9}          // Adjust grid width if needed
        detailGridWidth={3}
        dataTableProps={{
          pageSizeOptions: [10, 25, 50],
          // checkboxSelection: true, // Keep checkbox if needed
          initialState: {
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: {
              sortModel: [{ field: 'code', sort: 'asc' }],
            },
          }
        }}
      />

      {/* Customer Form Dialog (remains the same) */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯會員' : '添加會員'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField name="name" label="會員姓名" value={currentCustomer.name} onChange={handleInputChange} fullWidth required margin="dense" size="small"/>
            <TextField name="phone" label="電話" value={currentCustomer.phone} onChange={handleInputChange} fullWidth required margin="dense" size="small"/>
            <TextField name="email" label="電子郵件" value={currentCustomer.email} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            <TextField name="address" label="地址" value={currentCustomer.address} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            <TextField name="points" label="積分" type="number" value={currentCustomer.points} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            <FormControl fullWidth margin="dense" size="small">
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
          {/* Use MuiButton here as well */}
          <MuiButton onClick={handleCloseDialog} color="inherit">
            取消
          </MuiButton>
          <MuiButton onClick={handleSaveCustomer} color="primary" variant="contained">
            保存
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomersPage;

