import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  Snackbar, // Added Snackbar
  Alert // Added Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import CommonListPageLayout from '../components/common/CommonListPageLayout';
import useCustomerData from '../hooks/useCustomerData';

// Helper function to format date as YYYY/MM/DD
const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Invalid date
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// Initial state for the customer form
const initialCustomerState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  idCardNumber: "",
  birthdate: null,
  note: "",
  membershipLevel: 'regular',
};

// Mock data for test mode
const mockCustomersData = [
  {
    id: 'mockCust001',
    code: 'MKC001',
    name: '模擬客戶張三',
    phone: '0911222333',
    email: 'test1@example.com',
    address: '模擬地址一',
    idCardNumber: 'A123456789',
    birthdate: '1990-01-15',
    note: '這是模擬客戶資料。',
    membershipLevel: 'platinum',
    level: '白金會員' // Mapped level for display
  },
  {
    id: 'mockCust002',
    code: 'MKC002',
    name: '模擬客戶李四',
    phone: '0955666777',
    email: 'test2@example.com',
    address: '模擬地址二',
    idCardNumber: 'B987654321',
    birthdate: '1985-05-20',
    note: '另一筆模擬客戶資料。',
    membershipLevel: 'regular',
    level: '一般會員' // Mapped level for display
  },
];

const CustomersPage = () => {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  const {
    customers: actualCustomers,
    loading: actualLoading,
    error: actualError,
    addCustomer: actualAddCustomer,
    updateCustomer: actualUpdateCustomer,
    deleteCustomer: actualDeleteCustomer,
    mapMembershipLevel
  } = useCustomerData();

  const [localCustomers, setLocalCustomers] = useState([]);
  const [localSelectedCustomer, setLocalSelectedCustomer] = useState(null);

  useEffect(() => {
    if (isTestMode) {
      if (actualError || !actualCustomers || actualCustomers.length === 0) {
        setLocalCustomers(mockCustomersData.map(c => ({...c, level: mapMembershipLevel(c.membershipLevel)})));
        showSnackbar('測試模式：載入實際客戶資料失敗，已使用模擬數據。', 'info');
      } else {
        // If actual data is available, use it but still allow local modifications
        setLocalCustomers(actualCustomers.map(c => ({...c, level: mapMembershipLevel(c.membershipLevel)})));
      }
    } else {
      setLocalCustomers(actualCustomers.map(c => ({...c, level: mapMembershipLevel(c.membershipLevel)})));
    }
  }, [isTestMode, actualCustomers, actualError, mapMembershipLevel]);
  
  const customers = isTestMode ? localCustomers : localCustomers; // Always use localCustomers for display and modification in test mode
  const loading = isTestMode ? false : actualLoading;
  const error = isTestMode ? null : actualError;
  const selectedCustomer = isTestMode ? localSelectedCustomer : (actualCustomers.find(c => c.id === localSelectedCustomer?.id) || null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCustomerState, setCurrentCustomerState] = useState(initialCustomerState);
  const [formError, setFormError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const columns = [
    { field: 'code', headerName: '會員編號', width: 100 },
    { field: 'name', headerName: '會員姓名', width: 120 },
    { field: 'idCardNumber', headerName: '身分證', width: 140 },
    { field: 'birthdate', headerName: '出生年月日', width: 150, valueGetter: (params) => formatDateToYYYYMMDD(params.value) },
    { field: 'phone', headerName: '電話', width: 140 },
    { field: 'level', headerName: '會員等級', width: 120 },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="編輯">
            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(params.row.id); }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCustomerState({ ...currentCustomerState, [name]: value });
  };

  const handleEdit = (customer) => {
    setCurrentCustomerState({
      id: customer.id,
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      idCardNumber: customer.idCardNumber || "",
      birthdate: customer.birthdate || null,
      note: customer.note || "",
      membershipLevel: customer.membershipLevel || 'regular'
    });
    setEditMode(true);
    setFormError(null);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(isTestMode ? '測試模式：確定要模擬刪除此會員嗎？' : '確定要刪除此會員嗎？')) {
      if (isTestMode) {
        setLocalCustomers(prev => prev.filter(c => c.id !== id));
        if (localSelectedCustomer && localSelectedCustomer.id === id) {
          setLocalSelectedCustomer(null);
        }
        showSnackbar('測試模式：會員已模擬刪除', 'info');
        return;
      }
      try {
        await actualDeleteCustomer(id);
        // Data will be refetched by the hook, or we can manually filter if hook doesn't auto-update UI state
        if (localSelectedCustomer && localSelectedCustomer.id === id) {
          setLocalSelectedCustomer(null);
        }
         showSnackbar('會員已成功刪除', 'success');
      } catch (err) {
        showSnackbar(`刪除會員失敗: ${err.message}`, 'error');
      }
    }
  };

  const handleAddCustomer = () => {
    setCurrentCustomerState(initialCustomerState);
    setEditMode(false);
    setFormError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSaveCustomer = async () => {
    setFormError(null);
    const customerData = {
      name: currentCustomerState.name,
      phone: currentCustomerState.phone,
      email: currentCustomerState.email,
      address: currentCustomerState.address,
      idCardNumber: currentCustomerState.idCardNumber,
      birthdate: currentCustomerState.birthdate,
      note: currentCustomerState.note,
      membershipLevel: currentCustomerState.membershipLevel
    };

    if (isTestMode) {
      const newOrUpdatedCustomer = {
        ...customerData,
        id: editMode ? currentCustomerState.id : `mockCust${Date.now()}`,
        code: editMode ? currentCustomerState.code : `MKC${Date.now().toString().slice(-4)}`,
        level: mapMembershipLevel(customerData.membershipLevel)
      };
      if (editMode) {
        setLocalCustomers(prev => prev.map(c => c.id === newOrUpdatedCustomer.id ? newOrUpdatedCustomer : c));
        if(localSelectedCustomer && localSelectedCustomer.id === newOrUpdatedCustomer.id) {
            setLocalSelectedCustomer(newOrUpdatedCustomer);
        }
      } else {
        setLocalCustomers(prev => [...prev, newOrUpdatedCustomer]);
      }
      setOpenDialog(false);
      showSnackbar(editMode ? '測試模式：會員已模擬更新' : '測試模式：會員已模擬新增', 'info');
      return;
    }

    try {
      if (editMode) {
        await actualUpdateCustomer(currentCustomerState.id, customerData);
      } else {
        await actualAddCustomer(customerData);
      }
      setOpenDialog(false);
      showSnackbar(editMode ? '會員已更新' : '會員已新增', 'success');
    } catch (err) {
      setFormError(`保存會員失敗: ${err.message}`);
    }
  };

  const handleRowClick = (params) => {
    const customer = customers.find(c => c.id === params.row.id);
    setLocalSelectedCustomer(customer || null);
  };

  const actionButtons = (
    <MuiButton variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddCustomer}>
      添加會員 {isTestMode && "(模擬)"}
    </MuiButton>
  );

  const detailPanel = selectedCustomer ? (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>{selectedCustomer.name?.charAt(0) || 'C'}</Avatar>}
        title={<Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{selectedCustomer.name}</Typography>}
        subheader={`編號: ${selectedCustomer.code}`}
        action={
          <Box>
            <Tooltip title="編輯">
              <IconButton color="primary" onClick={() => handleEdit(selectedCustomer)} size="small"><EditIcon /></IconButton>
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
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>身分證:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.idCardNumber || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>出生年月日:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDateToYYYYMMDD(selectedCustomer.birthdate) || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>Email:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.email || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>等級:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.level}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>地址:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.address || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, flexDirection: 'column', alignItems: 'flex-start' }}><Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>備註:</Typography><Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedCustomer.note || '無'}</Typography></ListItem>
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
        title={isTestMode ? "會員管理 (測試模式)" : "會員管理"}
        actionButtons={actionButtons}
        columns={columns}
        rows={customers || []}
        loading={loading}
        error={error} // Error from hook for list loading errors (only if not test mode)
        onRowClick={handleRowClick}
        detailPanel={detailPanel}
        tableGridWidth={9}
        detailGridWidth={3}
        dataTableProps={{
          pageSizeOptions: [10, 25, 50],
          initialState: {
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: {
              sortModel: [{ field: 'code', sort: 'asc' }],
            },
          }
        }}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯會員' : '添加會員'} {isTestMode && "(模擬)"}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: formError ? 0 : 2 }}>
            <TextField name="name" label="會員姓名" value={currentCustomerState.name} onChange={handleInputChange} fullWidth required margin="dense" size="small"/>
            <TextField name="phone" label="電話" value={currentCustomerState.phone} onChange={handleInputChange} fullWidth required margin="dense" size="small"/>
            <TextField name="idCardNumber" label="身分證" value={currentCustomerState.idCardNumber} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            <TextField name="birthdate" label="出生年月日" type="date" value={currentCustomerState.birthdate ? new Date(currentCustomerState.birthdate).toISOString().split('T')[0] : ''} onChange={handleInputChange} fullWidth margin="dense" size="small" InputLabelProps={{ shrink: true }}/>
            <TextField name="email" label="電子郵件" value={currentCustomerState.email} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            <TextField name="address" label="地址" value={currentCustomerState.address} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            <TextField name="note" label="備註" value={currentCustomerState.note || ''} onChange={handleInputChange} fullWidth margin="dense" size="small" multiline rows={3}/>
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>會員等級</InputLabel>
              <Select name="membershipLevel" value={currentCustomerState.membershipLevel} onChange={handleInputChange} label="會員等級">
                <MenuItem value="regular">一般會員</MenuItem>
                <MenuItem value="platinum">白金會員</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleCloseDialog} color="inherit">取消</MuiButton>
          <MuiButton onClick={handleSaveCustomer} color="primary" variant="contained" disabled={loading && !isTestMode}>
            {(loading && !isTestMode) ? '保存中...' : '保存'}
          </MuiButton>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={isTestMode ? 4000 : 3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CustomersPage;

