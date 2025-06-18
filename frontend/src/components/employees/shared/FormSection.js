import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Divider, Grid } from '@mui/material';

/**
 * 表單區塊包裝組件
 * 統一的表單區塊樣式和結構
 */
const FormSection = ({ title, children, elevation = 0, sx = {} }) => {
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

FormSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  elevation: PropTypes.number,
  sx: PropTypes.object
};

export default FormSection;