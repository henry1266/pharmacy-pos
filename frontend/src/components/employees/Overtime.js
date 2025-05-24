import React from 'react';
import { Typography, Paper, Box, Container } from '@mui/material';

const Overtime = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          加班管理
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            此頁面將用於管理員工的加班記錄，包含加班申請、加班時數統計、加班費計算等功能。
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Overtime;
