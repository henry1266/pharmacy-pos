import React from 'react';
import { Grid, Box } from '@mui/material';

/**
 * 通用的兩欄式佈局組件
 * @param {Object} props - 組件屬性
 * @param {React.ReactNode} props.leftContent - 左欄內容
 * @param {React.ReactNode} props.rightContent - 右欄內容
 * @param {number|string} [props.leftWidth=4] - 左欄寬度 (Grid xs=12, md=leftWidth)
 * @param {number|string} [props.rightWidth=8] - 右欄寬度 (Grid xs=12, md=rightWidth)
 * @returns {React.ReactElement} 兩欄式佈局組件
 */
const TwoColumnLayout = ({ leftContent, rightContent, leftWidth = 4, rightWidth = 8 }) => {
  return (
    <Grid container spacing={3}>
      {/* Left Column */}
      <Grid item xs={12} md={leftWidth}>
        <Box>
          {leftContent}
        </Box>
      </Grid>
      {/* Right Column */}
      <Grid item xs={12} md={rightWidth}>
        <Box>
          {rightContent}
        </Box>
      </Grid>
    </Grid>
  );
};

export default TwoColumnLayout;

