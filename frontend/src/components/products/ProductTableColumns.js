import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';

const createProductColumns = (handleEditProduct, handleDeleteProduct, getTotalInventory, categories = []) => {
  return [
    { field: 'code', headerName: '商品編號', width: 120 },
    { field: 'name', headerName: '商品名稱', width: 180 },
    { field: 'sellingPrice', headerName: '售價', width: 150, type: 'number' },
    { 
      field: 'inventory', 
      headerName: '庫存', 
      width: 80, 
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
    },
    { 
      field: 'category', 
      headerName: '分類', 
      width: 100,
      valueGetter: (params) => {
        if (!params.value) return '無';
        const category = categories.find(c => c._id === params.value);
        return category ? category.name : params.value;
      }
    },
    { field: 'unit', headerName: '單位', width: 80 },
    { field: 'purchasePrice', headerName: '進貨價', width: 80, type: 'number' },
    {
      field: 'actions',
      headerName: '操作',
      width: 180,
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
                onClick={() => handleEditProduct(params.row.id, 'product')}
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
    },
  ];
};

const createMedicineColumns = (handleEditProduct, handleDeleteProduct, getTotalInventory, categories = []) => {
  return [
    { field: 'code', headerName: '藥品編號', width: 80 },
    { field: 'name', headerName: '藥品名稱', width: 180 },
    { 
      field: 'inventory', 
      headerName: '庫存', 
      width: 70, 
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
    },
    { field: 'barcode', headerName: '國際條碼', width: 120 },
    { field: 'purchasePrice', headerName: '進貨價', width: 100, type: 'number' },
    { field: 'healthInsuranceCode', headerName: '健保碼', width: 100 },
    { field: 'healthInsurancePrice', headerName: '健保價', width: 100, type: 'number' },
    { 
      field: 'category', 
      headerName: '分類', 
      width: 100,
      valueGetter: (params) => {
        if (!params.value) return '無';
        const category = categories.find(c => c._id === params.value);
        return category ? category.name : params.value;
      }
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 180,
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
                onClick={() => handleEditProduct(params.row.id, 'medicine')}
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
    },
  ];
};

export { createProductColumns, createMedicineColumns };
