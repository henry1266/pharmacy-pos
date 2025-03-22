import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button as MuiButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';

/**
 * 會員管理頁面組件
 * @returns {React.ReactElement} 會員管理頁面
 */
const CustomersPage = () => {
  // 模擬會員數據
  const [customers, setCustomers] = useState([
    { id: 1, name: '王小明', phone: '0912-345-678', email: 'wang@example.com', address: '台北市中正區忠孝東路123號', points: 250, level: '一般會員' },
    { id: 2, name: '李小華', phone: '0923-456-789', email: 'lee@example.com', address: '台北市信義區松仁路456號', points: 520, level: '銀卡會員' },
    { id: 3, name: '張大山', phone: '0934-567-890', email: 'chang@example.com', address: '新北市板橋區文化路789號', points: 780, level: '金卡會員' },
    { id: 4, name: '陳小玲', phone: '0945-678-901', email: 'chen@example.com', address: '台中市西區民生路234號', points: 150, level: '一般會員' },
    { id: 5, name: '林大方', phone: '0956-789-012', email: 'lin@example.com', address: '高雄市前鎮區中山路567號', points: 680, level: '銀卡會員' },
  ]);

  // 表格列配置
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: '會員姓名', width: 120 },
    { field: 'phone', headerName: '電話', width: 150 },
    { field: 'email', headerName: '電子郵件', width: 200 },
    { field: 'address', headerName: '地址', width: 300 },
    { field: 'points', headerName: '積分', width: 100, type: 'number' },
    { field: 'level', headerName: '會員等級', width: 120 },
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

  // 處理編輯會員
  const handleEdit = (id) => {
    console.log(`編輯會員 ID: ${id}`);
    // 實現編輯會員邏輯
  };

  // 處理刪除會員
  const handleDelete = (id) => {
    console.log(`刪除會員 ID: ${id}`);
    // 實現刪除會員邏輯
    setCustomers(customers.filter(customer => customer.id !== id));
  };

  // 處理添加會員
  const handleAddCustomer = () => {
    console.log('添加新會員');
    // 實現添加會員邏輯
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          會員管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          添加會員
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 0 }}>
            <DataTable
              rows={customers}
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

export default CustomersPage;
