import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../../redux/actions/customerActions';

const Customers = ({ 
  customers: { customers, loading, error },
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer
}) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    birthdate: '',
    gender: '',
    medicalHistory: '',
    allergies: ''
  });
  
  useEffect(() => {
    getCustomers();
    // eslint-disable-next-line
  }, []);
  
  const handleClickOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setFormData({
      code: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      birthdate: '',
      gender: '',
      medicalHistory: '',
      allergies: ''
    });
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    // 處理過敏藥物列表
    const customerData = {
      ...formData,
      allergies: formData.allergies ? formData.allergies.split(',').map(item => item.trim()) : []
    };
    
    addCustomer(customerData);
    handleClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          會員管理
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          新增會員
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="會員列表">
            <TableHead>
              <TableRow>
                <TableCell>會員編號</TableCell>
                <TableCell>會員姓名</TableCell>
                <TableCell>電話</TableCell>
                <TableCell>電子郵件</TableCell>
                <TableCell>地址</TableCell>
                <TableCell>會員等級</TableCell>
                <TableCell>積分</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell>{customer.code}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell>{customer.membershipLevel}</TableCell>
                    <TableCell>{customer.points}</TableCell>
                    <TableCell>
                      <Button size="small" color="primary">編輯</Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => deleteCustomer(customer._id)}
                      >
                        刪除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    尚無會員資料
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 新增會員對話框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>新增會員</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="code"
            name="code"
            label="會員編號"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.code}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="name"
            name="name"
            label="會員姓名"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="phone"
            name="phone"
            label="電話"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.phone}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="email"
            name="email"
            label="電子郵件"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="address"
            name="address"
            label="地址"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.address}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="birthdate"
            name="birthdate"
            label="出生日期"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            value={formData.birthdate}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="gender"
            name="gender"
            label="性別"
            select
            fullWidth
            variant="outlined"
            value={formData.gender}
            onChange={handleChange}
            SelectProps={{
              native: true,
            }}
            sx={{ mb: 2 }}
          >
            <option value=""></option>
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </TextField>
          <TextField
            margin="dense"
            id="medicalHistory"
            name="medicalHistory"
            label="病史"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={formData.medicalHistory}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="allergies"
            name="allergies"
            label="過敏藥物 (以逗號分隔)"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.allergies}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit}>確認</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const mapStateToProps = state => ({
  customers: state.customers
});

export default connect(
  mapStateToProps, 
  { getCustomers, addCustomer, updateCustomer, deleteCustomer }
)(Customers);
