import React from 'react';
import { Box, Chip, Typography } from '@mui/material';

interface TitleWithCountProps {
  title: string;
  count: number;
}

/**
 * 標題與數量顯示組件
 * 
 * 用於在標題旁邊顯示帶有底色的數量
 */
const TitleWithCount: React.FC<TitleWithCountProps> = ({ title, count }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="inherit" component="span">
        {title}
      </Typography>
      <Chip
        label={count}
        size="small"
        color="primary"
        sx={{
          height: '20px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          borderRadius: '10px',
        }}
      />
    </Box>
  );
};

export default TitleWithCount;