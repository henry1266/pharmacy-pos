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
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../../redux/actions/supplierActions';

const Suppliers = ({ 
  suppliers: { suppliers, loading, error },
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier
}) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    paymentTerms: '',
    notes: ''
  });
  
  useEffect(() => {
    getSuppliers();
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
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      paymentTerms: '',
      notes: ''
    });
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    addSupplier(formData);
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
          供應商管理
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          新增供應商
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="供應商列表">
            <TableHead>
              <TableRow>
                <TableCell>供應商編號</TableCell>
                <TableCell>供應商名稱</TableCell>
                <TableCell>聯絡人</TableCell>
                <TableCell>電話</TableCell>
                <TableCell>電子郵件</TableCell>
                <TableCell>地址</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <TableRow key={supplier._id}>
                    <TableCell>{supplier.code}</TableCell>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.address}</TableCell>
                    <TableCell>
                      <Button size="small" color="primary">編輯</Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => deleteSupplier(supplier._id)}
                      >
                        刪除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    尚無供應商資料
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 新增供應商對話框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>新增供應商</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="code"
            name="code"
            label="供應商編號"
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
            label="供應商名稱"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="contactPerson"
            name="contactPerson"
            label="聯絡人"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.contactPerson}
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
            id="taxId"
            name="taxId"
            label="統一編號"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.taxId}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="paymentTerms"
            name="paymentTerms"
            label="付款條件"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.paymentTerms}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="notes"
            name="notes"
            label="備註"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.notes}
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
  suppliers: state.suppliers
});

export default connect(
  mapStateToProps, 
  { getSuppliers, addSupplier, updateSupplier, deleteSupplier }
)(Suppliers);
