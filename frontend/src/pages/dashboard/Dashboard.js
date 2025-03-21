import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
}));

const Dashboard = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        儀表板
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Item>
            <Typography variant="h6" component="h2">
              今日銷售額
            </Typography>
            <Typography variant="h4" component="p" sx={{ mt: 2, color: 'primary.main' }}>
              $0
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Item>
            <Typography variant="h6" component="h2">
              本月銷售額
            </Typography>
            <Typography variant="h4" component="p" sx={{ mt: 2, color: 'primary.main' }}>
              $0
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Item>
            <Typography variant="h6" component="h2">
              庫存警告
            </Typography>
            <Typography variant="h4" component="p" sx={{ mt: 2, color: 'error.main' }}>
              0
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Item>
            <Typography variant="h6" component="h2">
              會員總數
            </Typography>
            <Typography variant="h4" component="p" sx={{ mt: 2, color: 'primary.main' }}>
              0
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12} md={8}>
          <Item>
            <Typography variant="h6" component="h2" align="left" sx={{ mb: 2 }}>
              銷售趨勢
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1">
                圖表將在連接數據後顯示
              </Typography>
            </Box>
          </Item>
        </Grid>
        <Grid item xs={12} md={4}>
          <Item>
            <Typography variant="h6" component="h2" align="left" sx={{ mb: 2 }}>
              熱門藥品
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1">
                數據將在連接後顯示
              </Typography>
            </Box>
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
