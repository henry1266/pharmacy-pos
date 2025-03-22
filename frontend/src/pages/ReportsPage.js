import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';

/**
 * 報表功能頁面組件
 * @returns {React.ReactElement} 報表功能頁面
 */
const ReportsPage = () => {
  // 模擬銷售報表數據
  const salesData = {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
    datasets: [
      {
        label: '2024年銷售額',
        data: [12500, 19000, 15000, 17500, 21000, 22500],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: '2023年銷售額',
        data: [10000, 15000, 13000, 16000, 19000, 20000],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  // 模擬藥品類別銷售數據
  const categoryData = {
    labels: ['止痛藥', '消炎藥', '降壓藥', '降膽固醇', '抗生素', '維他命'],
    datasets: [
      {
        label: '銷售數量',
        data: [350, 275, 180, 220, 310, 420],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  // 模擬會員消費數據
  const customerData = {
    labels: ['一般會員', '銀卡會員', '金卡會員'],
    datasets: [
      {
        label: '平均消費金額',
        data: [850, 1250, 1800],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        報表功能
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <LineChart
            title="月度銷售報表"
            data={salesData}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <BarChart
            title="藥品類別銷售統計"
            data={categoryData}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <BarChart
            title="會員等級消費分析"
            data={customerData}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              報表說明
            </Typography>
            <Typography variant="body1" paragraph>
              本頁面提供藥局銷售和庫存的各種統計報表，幫助管理者了解業務狀況並做出決策。
            </Typography>
            <Typography variant="body1" paragraph>
              月度銷售報表顯示每月銷售額的變化趨勢，並與去年同期進行比較。
            </Typography>
            <Typography variant="body1" paragraph>
              藥品類別銷售統計展示不同類別藥品的銷售數量，幫助識別熱門產品類別。
            </Typography>
            <Typography variant="body1" paragraph>
              會員等級消費分析顯示不同會員等級的平均消費金額，有助於制定會員營銷策略。
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
