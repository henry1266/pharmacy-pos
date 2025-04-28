import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { getProductCategories } from '../../services/productCategoryService';

const ProductFormDialog = ({
  open,
  onClose,
  currentProduct,
  editMode,
  productType,
  suppliers,
  handleInputChange,
  handleSave,
}) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // 獲取產品分類列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getProductCategories();
        setCategories(data);
      } catch (err) {
        console.error('獲取產品分類失敗:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editMode ? (productType === 'product' ? '編輯商品' : '編輯藥品') : (productType === 'product' ? '新增商品' : '新增藥品')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="code"
              label="編號"
              value={currentProduct.code}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              helperText="留空系統自動生成"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="shortCode"
              label="簡碼"
              value={currentProduct.shortCode}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="名稱"
              value={currentProduct.name}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              required
            />
          </Grid>
          
          {productType === 'product' ? (
            <Grid item xs={12} sm={6}>
              <TextField
                name="barcode"
                label="國際條碼"
                value={currentProduct.barcode}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="barcode"
                  label="國際條碼"
                  value={currentProduct.barcode}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="healthInsuranceCode"
                  label="健保碼"
                  value={currentProduct.healthInsuranceCode}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="healthInsurancePrice"
                  label="健保價"
                  type="number"
                  value={currentProduct.healthInsurancePrice}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="dense">
              <InputLabel id="category-label">分類</InputLabel>
              {loadingCategories ? (
                <CircularProgress size={24} sx={{ mt: 2, ml: 1 }} />
              ) : (
                <Select
                  labelId="category-label"
                  name="category"
                  value={currentProduct.category || ''}
                  onChange={handleInputChange}
                  label="分類"
                >
                  <MenuItem value="">
                    <em>無</em>
                  </MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="unit"
              label="單位"
              value={currentProduct.unit}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="purchasePrice"
              label="進貨價"
              type="number"
              value={currentProduct.purchasePrice}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="sellingPrice"
              label="售價"
              type="number"
              value={currentProduct.sellingPrice}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="minStock"
              label="最低庫存"
              type="number"
              value={currentProduct.minStock}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="dense">
              <InputLabel id="supplier-label">供應商</InputLabel>
              <Select
                labelId="supplier-label"
                name="supplier"
                value={currentProduct.supplier}
                onChange={handleInputChange}
                label="供應商"
              >
                <MenuItem value="">
                  <em>無</em>
                </MenuItem>
                {suppliers.map(supplier => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="描述"
              value={currentProduct.description}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormDialog;
