import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Grid,
  Divider,
  IconButton,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryList from './InventoryList';

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
 * 產品介面
 */
interface Product {
  id: string;
  name: string;
  code: string;
  shortCode?: string;
  unit?: string;
  barcode?: string;
  healthInsuranceCode?: string;
  supplier?: string | Supplier;
  category?: string | Category;
  minStock?: string | number;
  purchasePrice?: string | number;
  sellingPrice?: string | number;
  healthInsurancePrice?: string | number;
  description?: string;
  productType?: string;
  [key: string]: any;
}

/**
 * ProductDetailCard 組件的 Props 介面
 */
interface ProductDetailCardProps {
  product?: Product;
  suppliers: Supplier[];
  categories: Category[];
  handleEditProduct: (id: string, productType?: string) => void;
  handleDeleteProduct: (id: string) => void;
}

/**
 * 產品詳情卡片組件
 * 顯示產品的詳細信息
 */
const ProductDetailCard: React.FC<ProductDetailCardProps> = ({
  product,
  suppliers,
  categories,
  handleEditProduct,
  handleDeleteProduct
}) => {
  if (!product) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">
          請選擇一個產品查看詳情
        </Typography>
      </Paper>
    );
  }

  return (
    <Card>
      <CardHeader
        title={product.name}
          subheader={
        <>
          編號: {product.code}  | 簡碼: {product.shortCode} | 單位: {product.unit ?? '無'}<br />
          國際條碼: {product.barcode ?? '無'} | 健保碼: {product.healthInsuranceCode ?? '無'}
        </>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3} {...({} as any)}>
            <Typography variant="subtitle2">供應商: {
              (() => {
                if (!product.supplier) return '無';
                if (typeof product.supplier === 'string') {
                  return suppliers.find(s => s._id === product.supplier)?.name ?? product.supplier;
                }
                return product.supplier?.name ?? '無';
              })()
            }</Typography>
          </Grid>
          <Grid item xs={12} sm={3} {...({} as any)}>
            <Typography variant="subtitle2">分類: {
              (() => {
                if (!product.category) return '無';
                if (typeof product.category === 'string') {
                  return categories.find(c => c._id === product.category)?.name ?? product.category;
                }
                return product.category?.name ?? '無';
              })()
            }</Typography>
          </Grid>
          <Grid item xs={12} sm={3} {...({} as any)}>
            <Typography variant="subtitle2">最低庫存: {product.minStock ?? '0'}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={3} {...({} as any)}>
            <Typography variant="subtitle2">進貨價: {product.purchasePrice ?? '0'}</Typography>
          </Grid>
          <Grid item xs={12} sm={3} {...({} as any)}>
            <Typography variant="subtitle2">售價: {product.sellingPrice ?? '0'}</Typography>
          </Grid>
          <Grid item xs={12} sm={3} {...({} as any)}>
            <Typography variant="subtitle2">健保價: {product.healthInsurancePrice ?? '0'}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} {...({} as any)}>
            <Typography variant="subtitle2">備註: {product.description ?? '無'}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />

        <InventoryList productId={product.id} />
      </CardContent>
    </Card>
  );
};

export default ProductDetailCard;