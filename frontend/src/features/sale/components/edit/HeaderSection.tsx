import React from 'react';
import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { HeaderSectionProps } from '../../types/edit';

/**
 * 頁面標題和返回按鈕組件
 * 
 * @param props 組件屬性
 * @returns 頁面標題和返回按鈕組件
 */
const HeaderSection: React.FC<HeaderSectionProps> = ({ id, isMobile, onBack }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        mb: 3 
      }}
    >
      <Typography 
        variant={isMobile ? 'h5' : 'h4'} 
        component="h1" 
        gutterBottom={isMobile}
      >
        編輯銷售記錄 {id && `(ID: ${id})`}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mt: isMobile ? 1 : 0 }}
      >
        返回銷售列表
      </Button>
    </Box>
  );
};

export default HeaderSection;