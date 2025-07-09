import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Divider,
  Paper
} from '@mui/material';
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
  excludeFromStock?: boolean;
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
    <Card sx={{
      boxShadow: 2,
      borderRadius: 2,
      backgroundColor: 'background.paper'
    }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {product.name}
          </Typography>
        }
        subheader={
          <Paper sx={{
            p: 1,
            mt: 0.5,
            backgroundColor: 'action.hover',
            borderRadius: 1
          }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>編號:</strong> {product.code} | <strong>簡碼:</strong> {product.shortCode || '無'} | <strong>單位:</strong> {product.unit ?? '無'}
            </Typography>
            <Typography variant="body2">
              <strong>國際條碼:</strong> {product.barcode ?? '無'} | <strong>健保碼:</strong> {product.healthInsuranceCode ?? '無'}
            </Typography>
          </Paper>
        }
      />
      <CardContent sx={{ p: 1.5 }}>
        {/* 基本資訊區塊 */}
        <Paper sx={{ p: 1, mb: 1, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              基本資訊
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mx: 0.5 }}>
              |
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, flex: 1 }}>
              <Typography variant="body2">
                <strong>供應商:</strong> {
                  (() => {
                    if (!product.supplier) return '無';
                    if (typeof product.supplier === 'string') {
                      return suppliers.find(s => s._id === product.supplier)?.name ?? product.supplier;
                    }
                    return product.supplier?.name ?? '無';
                  })()
                }
              </Typography>
              <Typography variant="body2">
                <strong>分類:</strong> {
                  (() => {
                    if (!product.category) return '無';
                    if (typeof product.category === 'string') {
                      return categories.find(c => c._id === product.category)?.name ?? product.category;
                    }
                    return product.category?.name ?? '無';
                  })()
                }
              </Typography>
              <Typography variant="body2">
                <strong>最低庫存:</strong> {product.minStock ?? '0'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* 價格資訊區塊 */}
        <Paper sx={{ p: 1.5, mb: 1.5, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              價格資訊
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mx: 0.5 }}>
              |
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, flex: 1 }}>
              <Typography variant="body2">
                <strong>進貨價:</strong> <span style={{ color: '#1976d2' }}>NT$ {parseFloat(product.purchasePrice?.toString() ?? '0').toFixed(2)}</span>
              </Typography>
              <Typography variant="body2">
                <strong>售價:</strong> <span style={{ color: '#2e7d32' }}>NT$ {parseFloat(product.sellingPrice?.toString() ?? '0').toFixed(2)}</span>
              </Typography>
              <Typography variant="body2">
                <strong>健保價:</strong> <span style={{ color: '#ed6c02' }}>NT$ {parseFloat(product.healthInsurancePrice?.toString() ?? '0').toFixed(2)}</span>
              </Typography>
              <Typography variant="body2">
                <strong>不扣庫存:</strong> <span style={{ color: product.excludeFromStock ? '#ff9800' : '#757575' }}>
                  {product.excludeFromStock ? '是' : '否'}
                </span>
              </Typography>
            </Box>
          </Box>
        </Paper>
        
        {/* 備註區塊 */}
        {product.description && (
          <Paper sx={{ p: 1, mb: 1, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary', minWidth: '40px' }}>
                備註
              </Typography>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                |
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.4, flex: 1 }}>
                {product.description}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* 庫存清單區塊 */}
        <Paper sx={{ p: 1, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, color: 'text.primary' }}>
            庫存清單
          </Typography>

          <InventoryList productId={product.id} productName={product.name} />
        </Paper>
      </CardContent>
    </Card>
  );
};

export default ProductDetailCard;