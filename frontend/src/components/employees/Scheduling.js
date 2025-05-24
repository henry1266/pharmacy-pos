import React from 'react';
import { Typography, Paper, Box, Container } from '@mui/material';

const Scheduling = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          員工排班系統
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            此頁面將用於管理員工的排班系統，包含班表安排、輪班管理、休假申請等功能。
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Scheduling;
