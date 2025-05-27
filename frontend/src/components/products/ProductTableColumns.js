import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';

// 共用的欄位定義
const commonColumns = {
  code: (headerName = '商品編號', width = 120) => ({ 
    field: 'code', 
    headerName, 
    width 
  }),
  
  name: (headerName = '商品名稱', width = 180) => ({ 
    field: 'name', 
    headerName, 
    width 
  }),
  
  purchasePrice: (headerName = '進貨價', width = 80) => ({ 
    field: 'purchasePrice', 
    headerName, 
    width, 
    type: 'number' 
  }),
  
  // 庫存欄位渲染函數
  inventory: (getTotalInventory, headerName = '庫存', width = 80) => ({
    field: 'inventory', 
    headerName, 
    width, 
    valueGetter: (params) => getTotalInventory(params.row.id),
    renderCell: (params) => {
      const inventoryValue = getTotalInventory(params.row.id);
      const minStock = params.row.minStock || 0;
      let color = 'success.main';
      
      if (inventoryValue === '0') {
        color = 'error.main';
      } else if (inventoryValue !== '載入中...' && parseInt(inventoryValue) < minStock) {
        color = 'warning.main';
      }
      
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            color: color
          }}
        >
          {inventoryValue}
        </Typography>
      );
    }
  }),
  
  // 分類欄位渲染函數
  category: (categories, headerName = '分類', width = 100) => ({
    field: 'category', 
    headerName, 
    width,
    valueGetter: (params) => {
      if (!params.value) return '無';
      const category = categories.find(c => c._id === params.value);
      return category ? category.name : params.value;
    }
  }),
  
  // 操作按鈕渲染函數
  actions: (handleEditProduct, handleDeleteProduct, productType, headerName = '操作', width = 180) => ({
    field: 'actions',
    headerName,
    width,
    renderCell: (params) => {
      // 使用函數組件以便使用useNavigate
      const ActionButtons = () => {
        const navigate = useNavigate();
        
        const handleViewDetail = () => {
          navigate(`/products/${params.row.id}`);
        };
        
        return (
          <Box>
            <IconButton
              color="info"
              onClick={handleViewDetail}
              size="small"
              title="查看詳情"
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={() => handleEditProduct(params.row.id, productType)}
              size="small"
              title="編輯"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDeleteProduct(params.row.id)}
              size="small"
              title="刪除"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      };
      
      return <ActionButtons />;
    },
  })
};

const createProductColumns = (handleEditProduct, handleDeleteProduct, getTotalInventory, categories = []) => {
  return [
    commonColumns.code(),
    commonColumns.name(),
    { field: 'sellingPrice', headerName: '售價', width: 150, type: 'number' },
    commonColumns.inventory(getTotalInventory),
    commonColumns.category(categories),
    { field: 'unit', headerName: '單位', width: 80 },
    commonColumns.purchasePrice(),
    commonColumns.actions(handleEditProduct, handleDeleteProduct, 'product'),
  ];
};

const createMedicineColumns = (handleEditProduct, handleDeleteProduct, getTotalInventory, categories = []) => {
  return [
    commonColumns.code('藥品編號', 80),
    commonColumns.name('藥品名稱', 180),
    commonColumns.inventory(getTotalInventory, '庫存', 70),
    commonColumns.purchasePrice('進貨價', 100),
    { field: 'healthInsuranceCode', headerName: '健保碼', width: 100 },
    { field: 'healthInsurancePrice', headerName: '健保價', width: 100, type: 'number' },
    commonColumns.category(categories),
    commonColumns.actions(handleEditProduct, handleDeleteProduct, 'medicine', '操作', 160),
  ];
};

export { createProductColumns, createMedicineColumns };
