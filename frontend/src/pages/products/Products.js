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
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../redux/actions/productActions';

const Products = ({ 
  products: { products, loading, error },
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct
}) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    code: '',
    name: '',
    specification: '',
    category: '',
    unit: '',
    purchasePrice: '',
    sellingPrice: '',
    description: '',
    manufacturer: '',
    minStock: ''
  });
  
  useEffect(() => {
    getProducts();
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
      specification: '',
      category: '',
      unit: '',
      purchasePrice: '',
      sellingPrice: '',
      description: '',
      manufacturer: '',
      minStock: ''
    });
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const newProduct = {
      ...formData,
      purchasePrice: parseFloat(formData.purchasePrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      minStock: parseInt(formData.minStock, 10)
    };
    
    addProduct(newProduct);
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
          藥品管理
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          新增藥品
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="藥品列表">
            <TableHead>
              <TableRow>
                <TableCell>藥品編號</TableCell>
                <TableCell>藥品名稱</TableCell>
                <TableCell>規格</TableCell>
                <TableCell>類別</TableCell>
                <TableCell>單位</TableCell>
                <TableCell>售價</TableCell>
                <TableCell>庫存量</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.specification}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{product.sellingPrice}</TableCell>
                    <TableCell>{product.stock || 0}</TableCell>
                    <TableCell>
                      <Button size="small" color="primary">編輯</Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => deleteProduct(product._id)}
                      >
                        刪除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    尚無藥品資料
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 新增藥品對話框 */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>新增藥品</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="code"
            name="code"
            label="藥品編號"
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
            label="藥品名稱"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="specification"
            name="specification"
            label="規格"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.specification}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="category"
            name="category"
            label="類別"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.category}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="unit"
            name="unit"
            label="單位"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.unit}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="purchasePrice"
            name="purchasePrice"
            label="進貨價格"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.purchasePrice}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="sellingPrice"
            name="sellingPrice"
            label="售價"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.sellingPrice}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="minStock"
            name="minStock"
            label="最低庫存量"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.minStock}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="manufacturer"
            name="manufacturer"
            label="製造商"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.manufacturer}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="描述"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
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
  products: state.products
});

export default connect(
  mapStateToProps, 
  { getProducts, addProduct, updateProduct, deleteProduct }
)(Products);
