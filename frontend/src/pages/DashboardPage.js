import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';

/**
 * 儀表板頁面組件
 * @returns {React.ReactElement} 儀表板頁面
 */
const DashboardPage = () => {
  // 模擬銷售趨勢數據
  const salesTrendData = {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
    datasets: [
      {
        label: '銷售額',
        data: [12500, 19000, 15000, 17500, 21000, 22500],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // 模擬熱門藥品數據
  const topProductsData = {
    labels: ['阿斯匹靈', '布洛芬', '氨氯地平', '辛伐他汀', '甲硝唑'],
    datasets: [
      {
        label: '銷售數量',
        data: [120, 95, 75, 60, 50],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  // 儀表板統計數據
  const dashboardStats = [
    { title: '今日銷售額', value: '¥ 8,520', change: '+15%' },
    { title: '本月銷售額', value: '¥ 125,680', change: '+8%' },
    { title: '活躍會員數', value: '256', change: '+12%' },
    { title: '庫存預警', value: '5', change: '-2' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        儀表板
      </Typography>

      <Grid container spacing={3}>
        {/* 統計卡片 */}
        {dashboardStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
                  {stat.title}
                </Typography>
                <Typography variant="h4" component="div">
                  {stat.value}
                </Typography>
                <Typography 
                  variant="body2" 
                  color={stat.change.startsWith('+') ? 'success.main' : 'error.main'}
                >
                  {stat.change} 相比上期
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* 圖表 */}
        <Grid item xs={12} md={8}>
          <LineChart
            title="銷售趨勢"
            data={salesTrendData}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <BarChart
            title="熱門藥品"
            data={topProductsData}
          />
        </Grid>

        {/* 近期活動 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              近期活動
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ p: 1, borderLeft: '3px solid #1976d2' }}>
                <Typography variant="body2" color="text.secondary">今天 10:25</Typography>
                <Typography variant="body1">新增銷售訂單 #1025</Typography>
              </Box>
              <Box sx={{ p: 1, borderLeft: '3px solid #1976d2' }}>
                <Typography variant="body2" color="text.secondary">今天 09:40</Typography>
                <Typography variant="body1">新增會員：陳小玲</Typography>
              </Box>
              <Box sx={{ p: 1, borderLeft: '3px solid #f44336' }}>
                <Typography variant="body2" color="text.secondary">今天 09:15</Typography>
                <Typography variant="body1">庫存預警：阿斯匹靈庫存低於閾值</Typography>
              </Box>
              <Box sx={{ p: 1, borderLeft: '3px solid #1976d2' }}>
                <Typography variant="body2" color="text.secondary">昨天 16:30</Typography>
                <Typography variant="body1">更新藥品價格：布洛芬</Typography>
              </Box>
              <Box sx={{ p: 1, borderLeft: '3px solid #1976d2' }}>
                <Typography variant="body2" color="text.secondary">昨天 14:20</Typography>
                <Typography variant="body1">新增供應商：和平藥業</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 庫存預警 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              庫存預警
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ p: 1, borderLeft: '3px solid #f44336' }}>
                <Typography variant="body1">阿斯匹靈 - 剩餘庫存：20 (低於最低庫存量)</Typography>
              </Box>
              <Box sx={{ p: 1, borderLeft: '3px solid #f44336' }}>
                <Typography variant="body1">辛伐他汀 - 剩餘庫存：15 (低於最低庫存量)</Typography>
              </Box>
              <Box sx={{ p: 1, borderLeft: '3px solid #ff9800' }}>
                <Typography variant="body1">氨氯地平 - 即將到期：2024-05-30</Typography>
              </Box>
              <Box sx={{ p: 1, borderLeft: '3px solid #ff9800' }}>
                <Typography variant="body1">甲硝唑 - 即將到期：2024-06-15</Typography>
              </Box>
              <Box sx={{ p: 1, borderLeft: '3px solid #ff9800' }}>
                <Typography variant="body1">布洛芬 - 剩餘庫存：35 (接近最低庫存量)</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
