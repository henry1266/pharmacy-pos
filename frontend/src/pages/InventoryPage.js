import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button as MuiButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';

/**
 * 庫存管理頁面組件
 * @returns {React.ReactElement} 庫存管理頁面
 */
const InventoryPage = () => {
  // 模擬庫存數據
  const [inventory, setInventory] = useState([
    { id: 1, productId: 1, productName: '阿斯匹靈', batch: 'ASP20240301', quantity: 120, expiry: '2025-12-31', location: 'A-01-01' },
    { id: 2, productId: 2, productName: '布洛芬', batch: 'IBU20240215', quantity: 85, expiry: '2025-10-15', location: 'A-01-02' },
    { id: 3, productId: 3, productName: '氨氯地平', batch: 'AML20240110', quantity: 60, expiry: '2026-05-20', location: 'A-02-01' },
    { id: 4, productId: 4, productName: '辛伐他汀', batch: 'SIM20240220', quantity: 45, expiry: '2025-08-10', location: 'A-02-02' },
    { id: 5, productId: 5, productName: '甲硝唑', batch: 'MET20240125', quantity: 75, expiry: '2025-11-30', location: 'A-03-01' },
  ]);

  // 表格列配置
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'productId', headerName: '藥品ID', width: 100 },
    { field: 'productName', headerName: '藥品名稱', width: 150 },
    { field: 'batch', headerName: '批次號', width: 120 },
    { field: 'quantity', headerName: '數量', width: 100, type: 'number' },
    { field: 'expiry', headerName: '有效期限', width: 150 },
    { field: 'location', headerName: '儲位', width: 120 },
    {
      field: 'actions',
      headerName: '操作',
      width: 200,
      renderCell: (params) => (
        <Box>
          <MuiButton size="small" onClick={() => handleEdit(params.row.id)}>編輯</MuiButton>
          <MuiButton size="small" color="secondary" onClick={() => handleAdjust(params.row.id)}>調整</MuiButton>
          <MuiButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>刪除</MuiButton>
        </Box>
      ),
    },
  ];

  // 處理編輯庫存
  const handleEdit = (id) => {
    console.log(`編輯庫存 ID: ${id}`);
    // 實現編輯庫存邏輯
  };

  // 處理調整庫存
  const handleAdjust = (id) => {
    console.log(`調整庫存 ID: ${id}`);
    // 實現調整庫存邏輯
  };

  // 處理刪除庫存
  const handleDelete = (id) => {
    console.log(`刪除庫存 ID: ${id}`);
    // 實現刪除庫存邏輯
    setInventory(inventory.filter(item => item.id !== id));
  };

  // 處理添加庫存
  const handleAddInventory = () => {
    console.log('添加新庫存');
    // 實現添加庫存邏輯
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          庫存管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddInventory}
        >
          添加庫存
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 0 }}>
            <DataTable
              rows={inventory}
              columns={columns}
              pageSize={10}
              checkboxSelection
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryPage;
