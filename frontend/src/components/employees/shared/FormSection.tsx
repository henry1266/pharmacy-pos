import React from 'react';
import { Paper, Typography, Divider, Grid as MuiGrid, SxProps, Theme } from '@mui/material';

// 創建一個 Grid 組件，以便更容易使用
const Grid = MuiGrid as React.ComponentType<any>;

/**
 * 表單區塊包裝組件
 * 統一的表單區塊樣式和結構
 */
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  elevation?: number;
  sx?: SxProps<Theme>;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children, elevation = 0, sx = {} }) => {
  return (
    <Paper elevation={elevation} sx={{ p: 2, mb: 3, ...sx }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  );
};

export default FormSection;