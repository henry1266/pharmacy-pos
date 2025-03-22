import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button as MuiButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';

/**
 * 供應商管理頁面組件
 * @returns {React.ReactElement} 供應商管理頁面
 */
const SuppliersPage = () => {
  // 模擬供應商數據
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: '健康製藥', contact: '張經理', phone: '0912-345-678', email: 'health@example.com', address: '台北市中正區健康路123號' },
    { id: 2, name: '仁愛製藥', contact: '李經理', phone: '0923-456-789', email: 'renai@example.com', address: '台北市信義區仁愛路456號' },
    { id: 3, name: '康泰製藥', contact: '王經理', phone: '0934-567-890', email: 'kangtai@example.com', address: '新北市板橋區康泰路789號' },
    { id: 4, name: '和平藥業', contact: '陳經理', phone: '0945-678-901', email: 'peace@example.com', address: '台中市西區和平路234號' },
    { id: 5, name: '長青藥品', contact: '林經理', phone: '0956-789-012', email: 'evergreen@example.com', address: '高雄市前鎮區長青路567號' },
  ]);

  // 表格列配置
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: '供應商名稱', width: 150 },
    { field: 'contact', headerName: '聯絡人', width: 120 },
    { field: 'phone', headerName: '電話', width: 150 },
    { field: 'email', headerName: '電子郵件', width: 200 },
    { field: 'address', headerName: '地址', width: 300 },
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

  // 處理編輯供應商
  const handleEdit = (id) => {
    console.log(`編輯供應商 ID: ${id}`);
    // 實現編輯供應商邏輯
  };

  // 處理刪除供應商
  const handleDelete = (id) => {
    console.log(`刪除供應商 ID: ${id}`);
    // 實現刪除供應商邏輯
    setSuppliers(suppliers.filter(supplier => supplier.id !== id));
  };

  // 處理添加供應商
  const handleAddSupplier = () => {
    console.log('添加新供應商');
    // 實現添加供應商邏輯
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          供應商管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddSupplier}
        >
          添加供應商
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 0 }}>
            <DataTable
              rows={suppliers}
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

export default SuppliersPage;
