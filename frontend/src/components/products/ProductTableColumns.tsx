import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { GridColDef, GridValueGetterParams, GridRenderCellParams } from '@mui/x-data-grid';

/**
 * 產品介面
 */
interface Product {
  id: string;
  code: string;
  name: string;
  purchasePrice?: number | string;
  sellingPrice?: number | string;
  minStock?: number | string;
  category?: string;
  unit?: string;
  healthInsuranceCode?: string;
  healthInsurancePrice?: number | string;
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
 * 共用的欄位定義
 */
const commonColumns = {
  code: (headerName: string = '商品編號', width: number = 120): GridColDef => ({ 
    field: 'code', 
    headerName, 
    width 
  }),
  
  name: (headerName: string = '商品名稱', width: number = 180): GridColDef => ({ 
    field: 'name', 
    headerName, 
    width 
  }),
  
  purchasePrice: (headerName: string = '進貨價', width: number = 80): GridColDef => ({ 
    field: 'purchasePrice', 
    headerName, 
    width, 
    type: 'number' 
  }),
  
  // 庫存欄位渲染函數
  inventory: (getTotalInventory: (id: string) => string, headerName: string = '庫存', width: number = 80): GridColDef => ({
    field: 'inventory', 
    headerName, 
    width, 
    valueGetter: (params: GridValueGetterParams) => getTotalInventory(params.row.id),
    renderCell: (params: GridRenderCellParams) => {
      const inventoryValue = getTotalInventory(params.row.id);
      const minStock = params.row.minStock ?? 0;
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
  category: (categories: Category[], headerName: string = '分類', width: number = 100): GridColDef => ({
    field: 'category',
    headerName,
    width,
    valueGetter: (params: GridValueGetterParams) => {
      if (!params.value) return '無';
      
      // 處理 category 可能是字串 ID 或填充後的物件
      if (typeof params.value === 'string') {
        // category 是 ID，需要在 categories 陣列中查找
        const category = categories.find(c => c._id === params.value);
        return category ? category.name : params.value;
      } else if (params.value && typeof params.value === 'object' && 'name' in params.value) {
        // category 是已填充的物件，直接返回名稱
        return (params.value as Category).name;
      } else if (params.value && typeof params.value === 'object' && '_id' in params.value) {
        // category 是物件但沒有 name，嘗試用 _id 查找
        const categoryId = (params.value as any)._id;
        const category = categories.find(c => c._id === categoryId);
        return category ? category.name : categoryId;
      }
      
      return String(params.value);
    }
  }),
  
  // 操作按鈕渲染函數
  actions: (
    handleEditProduct: (id: string, productType: string) => void, 
    handleDeleteProduct: (id: string) => void, 
    productType: string, 
    headerName: string = '操作', 
    width: number = 180
  ): GridColDef => ({
    field: 'actions',
    headerName,
    width,
    renderCell: (params: GridRenderCellParams) => {
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

/**
 * 創建商品表格列定義
 */
const createProductColumns = (
  handleEditProduct: (id: string, productType: string) => void, 
  handleDeleteProduct: (id: string) => void, 
  getTotalInventory: (id: string) => string, 
  categories: Category[] = []
): GridColDef[] => {
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

/**
 * 創建藥品表格列定義
 */
const createMedicineColumns = (
  handleEditProduct: (id: string, productType: string) => void, 
  handleDeleteProduct: (id: string) => void, 
  getTotalInventory: (id: string) => string, 
  categories: Category[] = []
): GridColDef[] => {
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