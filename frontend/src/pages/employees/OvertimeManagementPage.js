import React from 'react';
import { Box, Typography, Paper, Breadcrumbs, Link } from '@mui/material';
import OvertimeManager from '../../components/employees/OvertimeManager';

/**
 * 加班管理頁面
 * 用於管理員工的加班記錄和加班時數
 */
const OvertimeManagementPage = () => {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link color="inherit" href="/">
          首頁
        </Link>
        <Link color="inherit" href="/employees">
          員工管理
        </Link>
        <Typography color="text.primary">加班管理</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom>加班管理</Typography>
          <Typography variant="body1" color="text.secondary">
            在此頁面您可以管理員工的加班記錄和查看加班時數統計
          </Typography>
        </div>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <OvertimeManager isAdmin={true} />
      </Paper>
    </Box>
  );
};

export default OvertimeManagementPage;