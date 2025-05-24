import React from 'react';
import { Typography, Paper, Box, Container } from '@mui/material';

const BasicInfo = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          員工基本資料
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            此頁面將用於管理員工的基本資料，包含個人資訊、聯絡方式、職位等資訊。
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default BasicInfo;
