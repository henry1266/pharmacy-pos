import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button as MuiButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../components/tables/DataTable';
import Button from '../components/common/Button';

/**
 * 銷售功能頁面組件
 * @returns {React.ReactElement} 銷售功能頁面
 */
const SalesPage = () => {
  // 模擬銷售數據
  const [sales, setSales] = useState([
    { id: 1, date: '2024-03-21', customer: '王小明', items: 3, total: 850, status: '已完成', paymentMethod: '現金' },
    { id: 2, date: '2024-03-20', customer: '李小華', items: 5, total: 1250, status: '已完成', paymentMethod: '信用卡' },
    { id: 3, date: '2024-03-20', customer: '張大山', items: 2, total: 520, status: '已完成', paymentMethod: '行動支付' },
    { id: 4, date: '2024-03-19', customer: '陳小玲', items: 4, total: 980, status: '已完成', paymentMethod: '現金' },
    { id: 5, date: '2024-03-18', customer: '林大方', items: 6, total: 1680, status: '已完成', paymentMethod: '信用卡' },
  ]);

  // 表格列配置
  const columns = [
    { field: 'id', headerName: '訂單ID', width: 100 },
    { field: 'date', headerName: '日期', width: 120 },
    { field: 'customer', headerName: '客戶', width: 150 },
    { field: 'items', headerName: '品項數', width: 100, type: 'number' },
    { field: 'total', headerName: '總金額', width: 120, type: 'number' },
    { field: 'status', headerName: '狀態', width: 120 },
    { field: 'paymentMethod', headerName: '付款方式', width: 120 },
    {
      field: 'actions',
      headerName: '操作',
      width: 200,
      renderCell: (params) => (
        <Box>
          <MuiButton size="small" onClick={() => handleView(params.row.id)}>查看</MuiButton>
          <MuiButton size="small" color="secondary" onClick={() => handlePrint(params.row.id)}>列印</MuiButton>
          <MuiButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>刪除</MuiButton>
        </Box>
      ),
    },
  ];

  // 處理查看銷售訂單
  const handleView = (id) => {
    console.log(`查看銷售訂單 ID: ${id}`);
    // 實現查看銷售訂單邏輯
  };

  // 處理列印銷售訂單
  const handlePrint = (id) => {
    console.log(`列印銷售訂單 ID: ${id}`);
    // 實現列印銷售訂單邏輯
  };

  // 處理刪除銷售訂單
  const handleDelete = (id) => {
    console.log(`刪除銷售訂單 ID: ${id}`);
    // 實現刪除銷售訂單邏輯
    setSales(sales.filter(sale => sale.id !== id));
  };

  // 處理新增銷售訂單
  const handleNewSale = () => {
    console.log('新增銷售訂單');
    // 實現新增銷售訂單邏輯
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          銷售管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleNewSale}
        >
          新增銷售
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 0 }}>
            <DataTable
              rows={sales}
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

export default SalesPage;
