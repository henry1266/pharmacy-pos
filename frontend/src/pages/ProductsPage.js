import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';

/**
 * 藥品管理頁面組件
 * @returns {React.ReactElement} 藥品管理頁面
 */
const ProductsPage = () => {
  // 模擬藥品數據
  const [products, setProducts] = useState([
    { id: 1, name: '阿斯匹靈', category: '止痛藥', supplier: '健康製藥', stock: 120, price: 150, expiry: '2025-12-31' },
    { id: 2, name: '布洛芬', category: '消炎藥', supplier: '仁愛製藥', stock: 85, price: 200, expiry: '2025-10-15' },
    { id: 3, name: '氨氯地平', category: '降壓藥', supplier: '康泰製藥', stock: 60, price: 350, expiry: '2026-05-20' },
    { id: 4, name: '辛伐他汀', category: '降膽固醇', supplier: '健康製藥', stock: 45, price: 420, expiry: '2025-08-10' },
    { id: 5, name: '甲硝唑', category: '抗生素', supplier: '仁愛製藥', stock: 75, price: 180, expiry: '2025-11-30' },
  ]);

  // 編輯對話框狀態
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // 表格列配置
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: '藥品名稱', width: 150 },
    { field: 'category', headerName: '類別', width: 120 },
    { field: 'supplier', headerName: '供應商', width: 150 },
    { field: 'stock', headerName: '庫存', width: 100, type: 'number' },
    { field: 'price', headerName: '價格', width: 100, type: 'number' },
    { field: 'expiry', headerName: '有效期限', width: 150 },
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

  // 處理編輯藥品
  const handleEdit = (id) => {
    console.log(`編輯藥品 ID: ${id}`);
    const productToEdit = products.find(product => product.id === id);
    if (productToEdit) {
      setCurrentProduct(productToEdit);
      setOpenEditDialog(true);
    }
  };

  // 處理編輯對話框關閉
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCurrentProduct(null);
  };

  // 處理編輯表單變更
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({
      ...currentProduct,
      [name]: name === 'stock' || name === 'price' ? Number(value) : value
    });
  };

  // 處理保存編輯
  const handleSaveEdit = () => {
    if (currentProduct) {
      setProducts(products.map(product => 
        product.id === currentProduct.id ? currentProduct : product
      ));
      handleCloseEditDialog();
    }
  };

  // 處理刪除藥品
  const handleDelete = (id) => {
    console.log(`刪除藥品 ID: ${id}`);
    // 實現刪除藥品邏輯
    setProducts(products.filter(product => product.id !== id));
  };

  // 處理添加藥品
  const handleAddProduct = () => {
    console.log('添加新藥品');
    // 實現添加藥品邏輯
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          藥品管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
        >
          添加藥品
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 0 }}>
            <DataTable
              rows={products}
              columns={columns}
              pageSize={10}
              checkboxSelection
            />
          </Paper>
        </Grid>
      </Grid>

      {/* 編輯藥品對話框 */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>編輯藥品</DialogTitle>
        <DialogContent>
          {currentProduct && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                margin="dense"
                label="藥品名稱"
                name="name"
                value={currentProduct.name}
                onChange={handleEditFormChange}
              />
              <TextField
                fullWidth
                margin="dense"
                label="類別"
                name="category"
                value={currentProduct.category}
                onChange={handleEditFormChange}
              />
              <TextField
                fullWidth
                margin="dense"
                label="供應商"
                name="supplier"
                value={currentProduct.supplier}
                onChange={handleEditFormChange}
              />
              <TextField
                fullWidth
                margin="dense"
                label="庫存"
                name="stock"
                type="number"
                value={currentProduct.stock}
                onChange={handleEditFormChange}
              />
              <TextField
                fullWidth
                margin="dense"
                label="價格"
                name="price"
                type="number"
                value={currentProduct.price}
                onChange={handleEditFormChange}
              />
              <TextField
                fullWidth
                margin="dense"
                label="有效期限"
                name="expiry"
                value={currentProduct.expiry}
                onChange={handleEditFormChange}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleCloseEditDialog}>取消</MuiButton>
          <MuiButton onClick={handleSaveEdit} color="primary">保存</MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
