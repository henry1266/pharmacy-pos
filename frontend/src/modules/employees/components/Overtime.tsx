import React from 'react';
import { Typography, Paper, Box, Container, Breadcrumbs, Link } from '@mui/material';
import OvertimeManager from './OvertimeManager';

/**
 * 加班管理頁面
 * 用於管理員工的加班記錄和加班時數
 */
const Overtime: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/">
            首頁
          </Link>
          <Link color="inherit" href="/employees">
            員工管理
          </Link>
          <Typography color="text.primary">加班管理</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          加班管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          在此頁面您可以管理員工的加班記錄和查看加班時數統計
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <OvertimeManager isAdmin={true} />
      </Paper>
    </Container>
  );
};

export default Overtime;