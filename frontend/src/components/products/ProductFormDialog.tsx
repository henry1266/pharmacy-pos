import React, { useState, useEffect, ChangeEvent } from 'react';
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
  SelectChangeEvent,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { getProductCategories } from '../../services/productCategoryService';

/**
 * 產品介面
 */
interface Product {
  id?: string;
  code?: string;
  shortCode?: string;
  name?: string;
  subtitle?: string;
  barcode?: string;
  healthInsuranceCode?: string;
  healthInsurancePrice?: string | number;
  category?: string;
  unit?: string;
  purchasePrice?: string | number;
  sellingPrice?: string | number;
  minStock?: string | number;
  supplier?: string;
  description?: string;
  excludeFromStock?: boolean;
  [key: string]: any;
}

/**
 * 供應商介面
 */
interface Supplier {
  _id: string;
  name: string;
  [key: string]: any;
}

/**
 * 分類介面
 */
interface Category {
  _id: string;
  name: string;
  [key: string]: any;
}

/**
 * ProductFormDialog 組件的 Props 介面
 */
interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  currentProduct?: Product;
  editMode?: boolean;
  productType?: string;
  suppliers?: Supplier[];
  categories?: Category[];
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  handleSave: () => void;
}

/**
 * 產品表單對話框組件
 * 用於新增或編輯產品
 */
const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onClose,
  currentProduct,
  editMode,
  productType,
  suppliers = [],
  categories: propCategories = [],
  handleInputChange,
  handleSave,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  // 獲取產品分類列表 - 優先使用從父組件傳入的分類，否則重新獲取
  useEffect(() => {
    if (propCategories.length > 0) {
      setCategories(propCategories);
      setLoadingCategories(false);
    } else {
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
    }
  }, [open, propCategories]);

  // 將巢狀三元運算子拆解為獨立陳述式
  const getDialogTitle = (): string => {
    if (editMode) {
      return productType === 'product' ? '編輯商品' : '編輯藥品';
    } else {
      return productType === 'product' ? '新增商品' : '新增藥品';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {getDialogTitle()}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <TextField
              name="code"
              label="編號"
              value={currentProduct?.code ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              helperText="留空系統自動生成"
            />
          </Grid>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <TextField
              name="shortCode"
              label="簡碼"
              value={currentProduct?.shortCode ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              required
            />
          </Grid>
          <Grid item xs={12} {...({} as any)}>
            <TextField
              name="name"
              label="名稱"
              value={currentProduct?.name ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              required
            />
          </Grid>
          <Grid item xs={12} {...({} as any)}>
            <TextField
              name="subtitle"
              label="副標題"
              value={currentProduct?.subtitle ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              helperText="商品名稱下方的副標題說明"
            />
          </Grid>
          
          {productType === 'product' ? (
            <Grid item xs={12} sm={6} {...({} as any)}>
              <TextField
                name="barcode"
                label="國際條碼"
                value={currentProduct?.barcode ?? ''}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={6} {...({} as any)}>
                <TextField
                  name="barcode"
                  label="國際條碼"
                  value={currentProduct?.barcode ?? ''}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12} sm={6} {...({} as any)}>
                <TextField
                  name="healthInsuranceCode"
                  label="健保碼"
                  value={currentProduct?.healthInsuranceCode ?? ''}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12} sm={6} {...({} as any)}>
                <TextField
                  name="healthInsurancePrice"
                  label="健保價"
                  type="number"
                  value={currentProduct?.healthInsurancePrice ?? ''}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sm={6} {...({} as any)}>
            <FormControl fullWidth margin="dense" {...({} as any)}>
              <InputLabel id="category-label">分類</InputLabel>
              {loadingCategories ? (
                <CircularProgress size={24} sx={{ mt: 2, ml: 1 }} />
              ) : (
                <Select
                  labelId="category-label"
                  name="category"
                  value={currentProduct?.category ?? ''}
                  onChange={handleInputChange}
                  label="分類"
                  {...({} as any)}
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
          <Grid item xs={12} sm={6} {...({} as any)}>
            <TextField
              name="unit"
              label="單位"
              value={currentProduct?.unit ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <TextField
              name="purchasePrice"
              label="進貨價"
              type="number"
              value={currentProduct?.purchasePrice ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <TextField
              name="sellingPrice"
              label="售價"
              type="number"
              value={currentProduct?.sellingPrice ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <TextField
              name="minStock"
              label="最低庫存"
              type="number"
              value={currentProduct?.minStock ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <FormControl fullWidth margin="dense" {...({} as any)}>
              <InputLabel id="supplier-label">供應商</InputLabel>
              <Select
                labelId="supplier-label"
                name="supplier"
                value={currentProduct?.supplier ?? ''}
                onChange={handleInputChange}
                label="供應商"
                {...({} as any)}
              >
                <MenuItem value="">
                  <em>無</em>
                </MenuItem>
                {suppliers?.map(supplier => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} {...({} as any)}>
            <TextField
              name="description"
              label="描述"
              value={currentProduct?.description ?? ''}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12} {...({} as any)}>
            <FormControlLabel
              control={
                <Checkbox
                  name="excludeFromStock"
                  checked={currentProduct?.excludeFromStock ?? false}
                  onChange={(e) => {
                    const syntheticEvent = {
                      target: {
                        name: 'excludeFromStock',
                        value: e.target.checked.toString(),
                        checked: e.target.checked,
                        type: 'checkbox'
                      }
                    } as unknown as ChangeEvent<HTMLInputElement>;
                    handleInputChange(syntheticEvent);
                  }}
                  color="primary"
                />
              }
              label="不扣庫存（毛利以數量×(售價-進價)計算）"
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