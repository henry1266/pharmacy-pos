import React, { useState, useCallback } from 'react';
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

import CommonListPageLayout from '../components/common/CommonListPageLayout';
import useCustomerData from '../hooks/useCustomerData'; // Import the custom hook

// Initial state for the customer form
const initialCustomerState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  idCardNumber: '',
  birthdate: null,
  membershipLevel: 'regular'
};

/**
 * 會員管理頁面組件 (Refactored)
 */
const CustomersPage = () => {
  // Use the custom hook for data management
  const {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    mapMembershipLevel // Get mapping function from hook
  } = useCustomerData();

  // State for dialog and form management
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(initialCustomerState);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // State for detail panel
  const [formError, setFormError] = useState(null); // Specific error state for the form

  // Table columns definition
  const columns = [
    { field: 'code', headerName: '會員編號', width: 120 },
    { field: 'name', headerName: '會員姓名', width: 120 },
    { field: 'phone', headerName: '電話', width: 150 },
    { field: 'idCardNumber', headerName: '身分證', width: 180 }, // Replaced points with idCardNumber
    { field: 'email', headerName: '電子郵件', width: 200 },
    { field: 'birthdate', headerName: '出生年月日', width: 150, valueGetter: (params) => params ? new Date(params).toLocaleDateString() : '' },
    { field: 'level', headerName: '會員等級', width: 120 }, // Display mapped level
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="編輯">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }}
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

  // Handler functions - updated to use hook methods
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Removed points specific logic, handle idCardNumber as a normal string
    setCurrentCustomer({ ...currentCustomer, [name]: value });
  };

  const handleEdit = (customer) => {
    // Use the full customer object passed from renderCell
    setCurrentCustomer({
      id: customer.id,
      code: customer.code, // Include code if needed, though usually not editable
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
       idCardNumber: customer.idCardNumber || ". // Replaced points with idCardNumber
      birthdate: customer.birthdate || null, // Add birthdate
      membershipLevel: customer.membershipLevel || 'regular' // Use original level from hook data
    });
    setEditMode(true);
    setFormError(null); // Clear previous form errors
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此會員嗎？')) {
      try {
        await deleteCustomer(id);
        if (selectedCustomer && selectedCustomer.id === id) {
          setSelectedCustomer(null); // Clear selection if deleted customer was selected
        }
      } catch (err) {
        // Error is already set in the hook, maybe show an alert
        alert(`刪除會員失敗: ${err.message}`);
        console.error('刪除會員操作失敗:', err);
      }
    }
  };

  const handleAddCustomer = () => {
    setCurrentCustomer(initialCustomerState);
    setEditMode(false);
    setFormError(null); // Clear previous form errors
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSaveCustomer = async () => {
    setFormError(null); // Clear previous form errors before saving
    try {
      const customerData = {
        name: currentCustomer.name,
        phone: currentCustomer.phone,
        email: currentCustomer.email,
        address: currentCustomer.address,
        idCardNumber: currentCustomer.idCardNumber, // Replaced points with idCardNumber
        birthdate: currentCustomer.birthdate, // Add birthdate
        membershipLevel: currentCustomer.membershipLevel
      };

      if (editMode) {
        await updateCustomer(currentCustomer.id, customerData);
      } else {
        await addCustomer(customerData);
      }
      setOpenDialog(false);
      // Data is refreshed within the hook
    } catch (err) {
      console.error('保存會員操作失敗:', err);
      setFormError(`保存會員失敗: ${err.message}`); // Set form-specific error
      // Optionally keep the dialog open on error
      // alert(`保存會員失敗: ${err.message}`); // Alert is optional if formError is shown
    }
  };

  // Handler for row click to update detail panel
  const handleRowClick = (params) => {
      // Find the customer from the hook's state
      setSelectedCustomer(customers.find(c => c.id === params.row.id));
  };

  // Define Action Buttons for the layout header
  const actionButtons = (
    <MuiButton
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      onClick={handleAddCustomer}
    >
      添加會員
    </MuiButton>
  );

  // Define Detail Panel for the layout (uses selectedCustomer state)
  const detailPanel = selectedCustomer ? (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>{selectedCustomer.name?.charAt(0) || 'C'}</Avatar>}
        title={<Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{selectedCustomer.name}</Typography>}
        subheader={`編號: ${selectedCustomer.code}`}
        action={
          <Box>
            <Tooltip title="編輯">
              {/* Pass the full selectedCustomer object to handleEdit */}
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
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>Email:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.email || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>地址:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.address || '無'}</Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>身分證:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.idCardNumber || '無'}</Typography></ListItem> {/* Replaced points with idCardNumber */}
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>出生年月日:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.birthdate ? new Date(selectedCustomer.birthdate).toLocaleDateString() : '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>等級:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.level}</Typography></ListItem> {/* Display mapped level */}
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
        rows={customers} // Use customers from hook
        loading={loading} // Use loading from hook
        error={error}     // Use error from hook (for list loading errors)
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

      {/* Customer Form Dialog - Consider moving to a separate component */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯會員' : '添加會員'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {formError}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: formError ? 0 : 2 }}>
            <TextField name="name" label="會員姓名" value={currentCustomer.name} onChange={handleInputChange} fullWidth required margin="dense" size="small"/>
            <TextField name="phone" label="電話" value={currentCustomer.phone} onChange={handleInputChange} fullWidth required margin="dense" size="small"/>
            <TextField name="idCardNumber" label="身分證" value={currentCustomer.idCardNumber} onChange={handleInputChange} fullWidth margin="dense" size="small"/> {/* Replaced points with idCardNumber */}
            <TextField name="birthdate" label="出生年月日" type="date" value={currentCustomer.birthdate ? new Date(currentCustomer.birthdate).toISOString().split('T')[0] : ''} onChange={handleInputChange} fullWidth margin="dense" size="small" InputLabelProps={{ shrink: true }}/>
            <TextField name="email" label="電子郵件" value={currentCustomer.email} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            <TextField name="address" label="地址" value={currentCustomer.address} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>會員等級</InputLabel>
              <Select
                name="membershipLevel"
                value={currentCustomer.membershipLevel}
                onChange={handleInputChange}
                label="會員等級"
              >
                {/* Use mapMembershipLevel to generate options dynamically or keep static */}
                <MenuItem value="regular">一般會員</MenuItem>
                <MenuItem value="silver">銀卡會員</MenuItem>
                <MenuItem value="gold">金卡會員</MenuItem>
                <MenuItem value="platinum">白金會員</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleCloseDialog} color="inherit">
            取消
          </MuiButton>
          <MuiButton onClick={handleSaveCustomer} color="primary" variant="contained" disabled={loading}> {/* Disable save button while loading */}
            {loading ? '保存中...' : '保存'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomersPage;

