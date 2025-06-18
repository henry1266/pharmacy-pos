import React from 'react';
import { Grid as MuiGrid, Box } from '@mui/material';

// 創建一個 Grid 組件，以便更容易使用
const Grid = MuiGrid as React.ComponentType<any>;

/**
 * 通用的兩欄式佈局組件
 */
interface TwoColumnLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftWidth?: number | string;
  rightWidth?: number | string;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ 
  leftContent, 
  rightContent, 
  leftWidth = 4, 
  rightWidth = 8 
}) => {
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