import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryList from '../common/InventoryList';

const ProductDetailCard = ({
  product,
  suppliers,
  handleEditProduct,
  handleDeleteProduct
}) => {
  const navigate = useNavigate();
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
        subheader={`編號: ${product.code} | 簡碼: ${product.shortCode}`}
        action={
          <Box>
            <IconButton
              color="info"
              onClick={() => navigate(`/products/${product.id}`)}
              title="查看詳情"
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={() => handleEditProduct(product.id, product.productType)}
              title="編輯產品"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDeleteProduct(product.id)}
              title="刪除產品"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">供應商: {product.supplier ? 
                suppliers.find(s => s._id === product.supplier)?.name || product.supplier 
                : '無'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">分類: {product.category || '無'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">單位: {product.unit || '無'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">進貨價: {product.purchasePrice || '0'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">售價: {product.sellingPrice || '0'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">最低庫存: {product.minStock || '0'}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={5}>
            <Typography variant="subtitle2">健保碼: {product.healthInsuranceCode || '無'}</Typography>
          </Grid>
          <Grid item xs={12} sm={5}>
            <Typography variant="subtitle2">健保價: {product.healthInsurancePrice || '0'}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">國際條碼: {product.barcode || '無'}</Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />

        <InventoryList productId={product.id} />
      </CardContent>
    </Card>
  );
};

export default ProductDetailCard;
